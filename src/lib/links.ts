/**
 * Guards for URLs that arrived from the research corpus rather than from this
 * repo. Source URLs are whatever the crawlers found, so they reach a render
 * unvalidated, and an href is the one place a bad one turns into a live link:
 * `javascript:` runs, and a bare word like "not-a-url" resolves against the
 * current page and silently becomes an internal link.
 */

/** The source URL if it is safe to put in an href, otherwise null. */
export function httpUrl(raw: string | null | undefined): string | null {
  if (!raw) return null
  try {
    const url = new URL(raw)
    return url.protocol === 'http:' || url.protocol === 'https:' ? raw : null
  } catch {
    return null
  }
}

/** Registrable host of a URL, for anchor text and grouping. */
export function hostOf(raw: string | null | undefined, fallback = 'the source site'): string {
  if (!raw) return fallback
  try {
    return new URL(raw).hostname.replace(/^www\./, '') || fallback
  } catch {
    return fallback
  }
}
