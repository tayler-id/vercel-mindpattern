import { track } from '@vercel/analytics'

export type AnalyticsProps = Record<string, string | number | boolean>

const ANON_KEY = 'mp_anon'
const OPTOUT_KEY = 'mp_optout'
const OWNER_KEY = 'mp_owner'
// Session-scoped campaign attribution (sessionStorage ONLY — dies with the tab).
const CAMPAIGN_KEY = 'mp_campaign'
const CHANNEL_KEY = 'mp_channel'

/**
 * Events that may carry campaign attribution (pilot spec section 11:
 * story, source-click, subscribe, and share). Everything else — scroll
 * depth, searches, web vitals — never carries campaign fields.
 */
const CAMPAIGN_EVENTS = new Set([
  'story_view',
  'source_click',
  'outbound_source_click',
  'subscribe_submitted',
  'subscribe_success',
  'share',
])

// Normalized safe IDs — lowercase alnum plus . _ - only, never a raw
// query-string value. Campaign ids are CampaignOS SHA-256 ids (64 chars).
const CAMPAIGN_ID_RE = /^[a-z0-9][a-z0-9._-]{0,63}$/
const CHANNEL_RE = /^[a-z0-9][a-z0-9._-]{0,31}$/

/** Allowlisted landing paths where campaign tags may be captured. */
function isCampaignLanding(pathname: string): boolean {
  return pathname === '/' || /^\/s\/[^/]+$/.test(pathname) || /^\/briefings\/[^/]+$/.test(pathname)
}

function normalizeTag(raw: string | null, pattern: RegExp): string {
  const value = (raw ?? '').trim().toLowerCase()
  return pattern.test(value) ? value : ''
}

/**
 * Minimal first-party attribution (pilot spec section 11). On an
 * allowlisted landing URL, `utm_campaign`/`utm_source` are normalized to
 * safe ids and kept in sessionStorage ONLY — captured at most once per
 * session, attached to that session's permitted events, never a new
 * long-lived identifier. The opt-out captures nothing. Captured or not,
 * every `utm_*` tag is stripped from the address bar afterwards so
 * internal and share URLs (which read `location.href`) never carry
 * acquisition tags. `mp_*` control flags are left alone.
 */
function captureCampaignTags() {
  try {
    const url = new URL(window.location.href)
    const utmKeys = [...url.searchParams.keys()].filter((k) => k.toLowerCase().startsWith('utm_'))
    if (utmKeys.length === 0) return
    if (!optedOut() && isCampaignLanding(url.pathname) && !sessionStorage.getItem(CAMPAIGN_KEY)) {
      const campaign = normalizeTag(url.searchParams.get('utm_campaign'), CAMPAIGN_ID_RE)
      if (campaign) {
        sessionStorage.setItem(CAMPAIGN_KEY, campaign)
        const channel = normalizeTag(url.searchParams.get('utm_source'), CHANNEL_RE)
        if (channel) sessionStorage.setItem(CHANNEL_KEY, channel)
      }
    }
    for (const key of utmKeys) url.searchParams.delete(key)
    window.history.replaceState(window.history.state, '', url.toString())
  } catch {
    // best-effort
  }
}

/** Campaign fields for one event — only for permitted event types. */
function campaignFields(name: string): { campaign_id?: string; source_channel?: string } {
  if (!CAMPAIGN_EVENTS.has(name)) return {}
  try {
    const campaign = sessionStorage.getItem(CAMPAIGN_KEY)
    if (!campaign) return {}
    const channel = sessionStorage.getItem(CHANNEL_KEY)
    return channel ? { campaign_id: campaign, source_channel: channel } : { campaign_id: campaign }
  } catch {
    return {}
  }
}

/**
 * Owner exclusion: visit any page with ?mp_optout=1 and this browser stops
 * sending analytics entirely (?mp_optout=0 turns it back on).
 */
function optedOut(): boolean {
  try {
    return localStorage.getItem(OPTOUT_KEY) === '1'
  } catch {
    return false
  }
}

/**
 * Owner mode: visit any page with ?mp_owner=1 and this browser's events keep
 * flowing but arrive tagged owner=1, so the dash shows them as "you" instead
 * of counting them as readers (?mp_owner=0 turns it back off).
 */
function isOwner(): boolean {
  try {
    return localStorage.getItem(OWNER_KEY) === '1'
  } catch {
    return false
  }
}

// Process both URL flags eagerly on page load — pages that fire no events
// (like the homepage) must still honor ?mp_optout=1 / ?mp_owner=1.
function applyUrlFlags() {
  try {
    const params = new URLSearchParams(window.location.search)
    for (const key of [OPTOUT_KEY, OWNER_KEY]) {
      const flag = params.get(key)
      if (flag === '1') localStorage.setItem(key, '1')
      if (flag === '0') localStorage.removeItem(key)
    }
  } catch {
    // best-effort
  }
}
if (typeof window !== 'undefined') {
  applyUrlFlags() // first: ?mp_optout=1 must apply before capture decides
  captureCampaignTags()
}

/** Dev traffic (localhost / LAN) never reaches the event store. */
function devTraffic(): boolean {
  try {
    return /^(localhost|127\.|192\.168\.|10\.)|\.local$/.test(window.location.hostname)
  } catch {
    return true
  }
}

/** Random first-party reader id: resettable, never tied to identity. */
function anonId(): string {
  try {
    let id = localStorage.getItem(ANON_KEY)
    if (!id) {
      id = crypto.randomUUID().replace(/-/g, '').slice(0, 24)
      localStorage.setItem(ANON_KEY, id)
    }
    return id
  } catch {
    return ''
  }
}

/** First-party beacon to /api/event via the proxy. Fire-and-forget. */
function beacon(name: string, props?: AnalyticsProps) {
  if (devTraffic()) return
  try {
    const payload = JSON.stringify({
      type: name,
      target: String(props?.to ?? props?.entity ?? props?.domain ?? props?.id ?? props?.from ?? ''),
      path: window.location.pathname,
      ref_domain: document.referrer ? new URL(document.referrer).hostname : '',
      anon_id: anonId(),
      value: typeof props?.depth === 'number' ? props.depth : 0,
      owner: isOwner() ? 1 : 0,
      ...campaignFields(name),
    })
    if (!navigator.sendBeacon?.('/api/proxy/event', new Blob([payload], { type: 'application/json' }))) {
      fetch('/api/proxy/event', { method: 'POST', body: payload, keepalive: true }).catch(() => {})
    }
  } catch {
    // analytics is best-effort
  }
}

/**
 * Privacy-safe event tracking: anonymous, no PII, no emails, no user ids.
 * Double-writes to Vercel Analytics and the first-party event store.
 * Fails silently — analytics must never break the page.
 */
export function trackEvent(name: string, props?: AnalyticsProps) {
  if (optedOut()) return
  try {
    track(name, props)
  } catch {
    // best-effort
  }
  beacon(name, props)
}

/** Story views: fired by pages, not clicks. */
export function trackView(kind: string, id: string) {
  if (optedOut()) return
  if (kind === 'story') beacon('story_view', { id })
}
