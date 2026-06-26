/** Resolve a source URL/domain to a favicon (Google s2 service). */
export function faviconFor(
  urlOrDomain: string | null | undefined,
  size = 64,
): string | null {
  if (!urlOrDomain) return null
  let domain = urlOrDomain
  try {
    if (urlOrDomain.includes('://')) domain = new URL(urlOrDomain).hostname
  } catch {
    /* fall through with the raw string */
  }
  domain = domain.replace(/^www\./, '').trim()
  if (!domain) return null
  return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=${size}`
}
