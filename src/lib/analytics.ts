import { track } from '@vercel/analytics'

export type AnalyticsProps = Record<string, string | number | boolean>

const ANON_KEY = 'mp_anon'
const OPTOUT_KEY = 'mp_optout'
const OWNER_KEY = 'mp_owner'
const UTM_SOURCE_KEY = 'mp_utm_source'

const ANON_ID_RE = /^[A-Za-z0-9_-]{8,64}$/
const UTM_SOURCE_RE = /^[a-z0-9][a-z0-9._-]{0,79}$/

let memoryAnonId = ''
let memoryUtmSource = ''
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

function validStoredValue(storage: Storage | null, key: string, pattern: RegExp): string {
  if (!storage) return ''
  try {
    const value = storage.getItem(key) ?? ''
    return pattern.test(value) ? value : ''
  } catch {
    return ''
  }
}

function storedUtmSource(): string {
  if (UTM_SOURCE_RE.test(memoryUtmSource)) return memoryUtmSource
  const source = validStoredValue(sessionStorageOrNull(), UTM_SOURCE_KEY, UTM_SOURCE_RE)
  if (source) memoryUtmSource = source
  return source
}

function rememberUtmSource(source: string) {
  memoryUtmSource = source
  try {
    sessionStorageOrNull()?.setItem(UTM_SOURCE_KEY, source)
  } catch {
    // The module-scoped fallback keeps attribution for this document.
  }
}

/**
 * Capture a normalized first-touch source for this browser session, then
 * remove acquisition tags from the visible URL so they cannot leak into
 * internal or shared links. Other parameters, including mp_* flags, remain.
 */
function captureUtmSource() {
  try {
    const url = new URL(window.location.href)
    const utmKeys = [...url.searchParams.keys()].filter((key) =>
      key.toLowerCase().startsWith('utm_'),
    )
    if (utmKeys.length === 0) return

    if (!optedOut() && !storedUtmSource()) {
      const sourceKey = utmKeys.find((key) => key.toLowerCase() === 'utm_source')
      const source = ((sourceKey ? url.searchParams.get(sourceKey) : '') ?? '')
        .trim()
        .toLowerCase()
        .slice(0, 80)
      if (UTM_SOURCE_RE.test(source)) rememberUtmSource(source)
    }

    for (const key of utmKeys) url.searchParams.delete(key)
    window.history.replaceState(window.history.state, '', url.toString())
  } catch {
    // best-effort
  }
}

/** Dev traffic (localhost / LAN) never reaches the event store. */
function devTraffic(): boolean {
  try {
    return /^(localhost|127\.|192\.168\.|10\.)|\.local$/.test(window.location.hostname)
  } catch {
    return true
  }
}

function localStorageOrNull(): Storage | null {
  try {
    return window.localStorage
  } catch {
    return null
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

/** Random first-party reader id: resettable, never tied to identity. */
function anonId(): string {
  const local = localStorageOrNull()
  const durableId = validStoredValue(local, ANON_KEY, ANON_ID_RE)
  if (durableId) {
    memoryAnonId = durableId
    return durableId
  }

  const session = sessionStorageOrNull()
  const sessionId = validStoredValue(session, ANON_KEY, ANON_ID_RE)
  if (sessionId) {
    memoryAnonId = sessionId
    return sessionId
  }

  if (!ANON_ID_RE.test(memoryAnonId)) memoryAnonId = newAnonId()
  if (!persistAnonId(local, memoryAnonId)) persistAnonId(session, memoryAnonId)
  return memoryAnonId
}

function refDomain(): string {
  const source = storedUtmSource()
  if (source) return source
  try {
    return document.referrer ? new URL(document.referrer).hostname : ''
  } catch {
    return ''
  }
}

if (typeof window !== 'undefined') {
  applyUrlFlags()
  captureUtmSource()
}

/** First-party beacon to /api/event via the proxy. Fire-and-forget. */
function beacon(name: string, props?: AnalyticsProps) {
  if (devTraffic()) return
  try {
    const payload = JSON.stringify({
      type: name,
      target: String(props?.to ?? props?.entity ?? props?.domain ?? props?.id ?? props?.from ?? ''),
      path: window.location.pathname,
      ref_domain: refDomain(),
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

/** Route page view for the first-party event store; Vercel tracks separately. */
export function trackPageView(pathname: string) {
  if (optedOut()) return
  // Repeat after hydration: Next may restore the server URL after the eager
  // capture above, so this also guarantees acquisition tags stay stripped.
  captureUtmSource()
  beacon('page_view', { id: pathname })
}
