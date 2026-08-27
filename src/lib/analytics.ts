import { track } from '@vercel/analytics'

export type AnalyticsProps = Record<string, string | number | boolean>

const ANON_KEY = 'mp_anon'

/** False when nothing on this client can hold the reader id, so every page
 *  load would mint a new one. Reported with the event so the dashboard can
 *  separate a reader it can count from churn it cannot. */
let anonDurable = false
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

const ANON_ID_RE = /^[A-Za-z0-9_-]{8,64}$/
// Normalized safe IDs — lowercase alnum plus . _ - only, never a raw
// query-string value. Campaign ids are CampaignOS SHA-256 ids (64 chars).
const CAMPAIGN_ID_RE = /^[a-z0-9][a-z0-9._-]{0,63}$/
const CHANNEL_RE = /^[a-z0-9][a-z0-9._-]{0,31}$/

// Module-scoped fallbacks for browsers that block storage entirely. These die
// with the document, which matches the session-only lifetime of everything
// they stand in for — a blocked browser still gets counted and attributed.
let memoryAnonId = ''
let memoryCampaign = ''
let memoryChannel = ''
let memoryOptOut = false

/**
 * Owner exclusion: visit any page with ?mp_optout=1 and this browser stops
 * sending analytics entirely (?mp_optout=0 turns it back on).
 */
function optedOut(): boolean {
  try {
    return memoryOptOut || localStorage.getItem(OPTOUT_KEY) === '1'
  } catch {
    return memoryOptOut
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
  let params: URLSearchParams
  try {
    params = new URLSearchParams(window.location.search)
  } catch {
    return
  }
  for (const key of [OPTOUT_KEY, OWNER_KEY]) {
    const flag = params.get(key)
    if (key === OPTOUT_KEY) {
      if (flag === '1') memoryOptOut = true
      if (flag === '0') memoryOptOut = false
    }
    try {
      if (flag === '1') localStorage.setItem(key, '1')
      if (flag === '0') localStorage.removeItem(key)
    } catch {
      // best-effort
    }
  }
}

function sessionStorageOrNull(): Storage | null {
  try {
    return window.sessionStorage
  } catch {
    return null
  }
}

function localStorageOrNull(): Storage | null {
  try {
    return window.localStorage
  } catch {
    return null
  }
}

function validStoredValue(storage: Storage | null, key: string, pattern: RegExp): string {
  if (!storage) return ''
  try {
    const value = storage.getItem(key) ?? ''
    return pattern.test(value) ? value : ''
  } catch {
    return ''
  }
}

/** Allowlisted landing paths where campaign tags may be captured. */
function isCampaignLanding(pathname: string): boolean {
  return pathname === '/' || /^\/s\/[^/]+$/.test(pathname) || /^\/briefings\/[^/]+$/.test(pathname)
}

function normalizeTag(raw: string | null, pattern: RegExp): string {
  const value = (raw ?? '').trim().toLowerCase()
  return pattern.test(value) ? value : ''
}

/** Campaign id captured this session, from storage or the memory fallback. */
function storedCampaign(): string {
  if (CAMPAIGN_ID_RE.test(memoryCampaign)) return memoryCampaign
  const campaign = validStoredValue(sessionStorageOrNull(), CAMPAIGN_KEY, CAMPAIGN_ID_RE)
  if (campaign) memoryCampaign = campaign
  return campaign
}

/** Acquisition channel captured this session (normalized `utm_source`). */
function storedChannel(): string {
  if (CHANNEL_RE.test(memoryChannel)) return memoryChannel
  const channel = validStoredValue(sessionStorageOrNull(), CHANNEL_KEY, CHANNEL_RE)
  if (channel) memoryChannel = channel
  return channel
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

    if (!optedOut() && isCampaignLanding(url.pathname) && !storedCampaign()) {
      const campaign = normalizeTag(url.searchParams.get('utm_campaign'), CAMPAIGN_ID_RE)
      if (campaign) {
        const channel = normalizeTag(url.searchParams.get('utm_source'), CHANNEL_RE)
        // Memory first, so attribution survives a browser that blocks storage.
        memoryCampaign = campaign
        if (channel) memoryChannel = channel
        const session = sessionStorageOrNull()
        try {
          session?.setItem(CAMPAIGN_KEY, campaign)
          if (channel) session?.setItem(CHANNEL_KEY, channel)
        } catch {
          // The module-scoped fallback keeps attribution for this document.
        }
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
  const campaign = storedCampaign()
  if (!campaign) return {}
  const channel = storedChannel()
  return channel ? { campaign_id: campaign, source_channel: channel } : { campaign_id: campaign }
}

/** Dev traffic (localhost / LAN) never reaches the event store. */
export function isDevTraffic(hostname: string): boolean {
  return /^(localhost|127\.|192\.168\.|10\.)|\.local$/.test(hostname)
}

function devTraffic(): boolean {
  try {
    return isDevTraffic(window.location.hostname)
  } catch {
    return true
  }
}

function newAnonId(): string {
  try {
    const id = crypto.randomUUID().replace(/-/g, '').slice(0, 24)
    if (ANON_ID_RE.test(id)) return id
  } catch {
    // Fall through for browsers without randomUUID in this context.
  }
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2)}${Math.random()
    .toString(36)
    .slice(2)}`
    .slice(0, 24)
    .padEnd(8, '0')
}

function persistAnonId(storage: Storage | null, id: string): boolean {
  if (!storage) return false
  try {
    storage.setItem(ANON_KEY, id)
    return true
  } catch {
    return false
  }
}

/** Read the reader id from a first-party cookie, validated before use.
 *
 * localStorage and sessionStorage are one permission; cookies are another. A
 * profile that refuses both storages often still keeps a same-site cookie, and
 * a cookie survives a navigation, which a module-level variable does not. That
 * gap is what made one crawler over forty pages look like forty new readers on
 * 2026-08-26.
 */
function cookieAnonId(): string | null {
  try {
    const raw = document.cookie || ''
    for (const part of raw.split(';')) {
      const [name, ...rest] = part.trim().split('=')
      if (name !== ANON_KEY) continue
      const value = decodeURIComponent(rest.join('='))
      return ANON_ID_RE.test(value) ? value : null
    }
  } catch {
    // no document, or cookies unavailable in this context
  }
  return null
}

function persistAnonCookie(id: string): boolean {
  try {
    // Lax so it survives a normal navigation, one year, path-wide, no PII.
    document.cookie =
      `${ANON_KEY}=${encodeURIComponent(id)}; Max-Age=31536000; path=/; SameSite=Lax`
    return cookieAnonId() === id
  } catch {
    return false
  }
}

/** Random first-party reader id: resettable, never tied to identity. */
function anonId(): string {
  const local = localStorageOrNull()
  const durableId = validStoredValue(local, ANON_KEY, ANON_ID_RE)
  if (durableId) {
    memoryAnonId = durableId
    // The id was read back from localStorage, which is exactly what durable
    // means: it survived a previous page load.
    anonDurable = true
    return durableId
  }

  const cookieId = cookieAnonId()
  if (cookieId) {
    memoryAnonId = cookieId
    // Re-assert it so an expiring cookie keeps rolling forward.
    anonDurable = persistAnonCookie(cookieId) || persistAnonId(local, cookieId)
    return cookieId
  }

  const session = sessionStorageOrNull()
  const sessionId = validStoredValue(session, ANON_KEY, ANON_ID_RE)
  if (sessionId) {
    memoryAnonId = sessionId
    // sessionStorage dies with the tab, so an id living only there is not
    // durable. Try to promote it to a store that survives; report the outcome.
    anonDurable = persistAnonId(local, sessionId) || persistAnonCookie(sessionId)
    return sessionId
  }

  if (!ANON_ID_RE.test(memoryAnonId)) memoryAnonId = newAnonId()
  // localStorage first, matching the read order above, so a returning reader
  // is found in the first store checked. The cookie is the fallback that
  // survives blocked storage and a navigation; both verify their write, so
  // durable means one of them actually round-tripped, and a write that just
  // failed is not retried in the same tick.
  const stored =
    persistAnonId(local, memoryAnonId) || persistAnonCookie(memoryAnonId)
  persistAnonId(session, memoryAnonId)
  anonDurable = stored
  return memoryAnonId
}

/** Captured acquisition channel wins over the raw referrer host. */
function refDomain(): string {
  const channel = storedChannel()
  if (channel) return channel
  try {
    return document.referrer ? new URL(document.referrer).hostname : ''
  } catch {
    return ''
  }
}

if (typeof window !== 'undefined') {
  applyUrlFlags() // first: ?mp_optout=1 must apply before capture decides
  captureCampaignTags()
}

/** First-party beacon to /api/event via the proxy. Fire-and-forget. */
function beacon(name: string, props?: AnalyticsProps) {
  if (devTraffic()) return
  try {
    // anonId() sets anonDurable as a side effect, so it must run before the
    // durable field below reads the flag.
    const id = anonId()
    const payload = JSON.stringify({
      type: name,
      target: String(props?.to ?? props?.entity ?? props?.domain ?? props?.id ?? props?.from ?? ''),
      path: window.location.pathname,
      ref_domain: refDomain(),
      anon_id: id,
      value: typeof props?.depth === 'number' ? props.depth : 0,
      owner: isOwner() ? 1 : 0,
      durable: anonDurable ? 1 : 0,
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

/** Route page view for the first-party event store; Vercel tracks separately. */
export function trackPageView(pathname: string) {
  if (optedOut()) return
  // Repeat after hydration: Next may restore the server URL after the eager
  // capture above, so this also guarantees acquisition tags stay stripped.
  captureCampaignTags()
  beacon('page_view', { id: pathname })
}

/** Test hooks. Not part of the public surface. */
export function __anonIdForTests(): string {
  return anonId()
}

export function __anonDurableForTests(): boolean {
  anonId()
  return anonDurable
}
