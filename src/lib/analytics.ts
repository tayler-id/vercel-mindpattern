import { track } from '@vercel/analytics'

export type AnalyticsProps = Record<string, string | number | boolean>

const ANON_KEY = 'mp_anon'
const OPTOUT_KEY = 'mp_optout'
const OWNER_KEY = 'mp_owner'

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
  applyUrlFlags()
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
