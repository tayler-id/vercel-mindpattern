import { track } from '@vercel/analytics'

export type AnalyticsProps = Record<string, string | number | boolean>

const ANON_KEY = 'mp_anon'

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
  try {
    const payload = JSON.stringify({
      type: name,
      target: String(props?.to ?? props?.entity ?? props?.domain ?? props?.id ?? props?.from ?? ''),
      path: window.location.pathname,
      ref_domain: document.referrer ? new URL(document.referrer).hostname : '',
      anon_id: anonId(),
      value: typeof props?.depth === 'number' ? props.depth : 0,
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
  try {
    track(name, props)
  } catch {
    // best-effort
  }
  beacon(name, props)
}

/** Story views: fired by pages, not clicks. */
export function trackView(kind: string, id: string) {
  if (kind === 'story') beacon('story_view', { id })
}
