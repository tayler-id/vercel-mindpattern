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

/** Anchor text for a source link that actually names what it points at.
 *
 * The pipeline stamps every github ref with the title "GitHub", so a story
 * citing three repos rendered three identical anchors and the owner could not
 * find his own project's link on 2026-08-27. A title is treated as generic
 * when it is empty or just restates the domain; the label then comes from the
 * URL path: owner/repo for GitHub, the trimmed path elsewhere, the domain
 * when there is no path. Capped so a runaway path cannot wreck the layout.
 */
export function sourceLabel(
  url: string | null | undefined,
  title: string | null | undefined,
  domain: string | null | undefined,
): string {
  const host = hostOf(url, (domain || '').replace(/^www\./, '') || 'source')
  const bare = host.split('.')[0]
  const cleaned = (title || '').trim()
  const generic =
    !cleaned ||
    cleaned.toLowerCase() === host.toLowerCase() ||
    cleaned.toLowerCase() === bare.toLowerCase() ||
    cleaned.toLowerCase() === (domain || '').replace(/^www\./, '').toLowerCase()
  if (!generic) return cleaned.slice(0, 64)

  const safe = httpUrl(url)
  if (!safe) return host
  const segments = new URL(safe).pathname.split('/').filter(Boolean)
  if (segments.length === 0) return host

  const path =
    host === 'github.com' && segments.length >= 2
      ? `${segments[0]}/${segments[1]}`
      : `${host}/${segments.join('/')}`
  return path.length > 64 ? `${path.slice(0, 61)}...` : path
}
