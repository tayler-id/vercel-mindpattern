import { track } from '@vercel/analytics'

export type AnalyticsProps = Record<string, string | number | boolean>

/**
 * Privacy-safe event tracking: anonymous, no PII, no emails, no user ids.
 * Fails silently — analytics must never break the page.
 */
export function trackEvent(name: string, props?: AnalyticsProps) {
  try {
    track(name, props)
  } catch {
    // analytics is best-effort
  }
}
