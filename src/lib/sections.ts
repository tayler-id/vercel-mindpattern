/** Map a research agent to a Wire section kicker (varied, prototype-style). */
const SECTION: Record<string, string> = {
  'agents-researcher': 'AGENTS',
  'arxiv-researcher': 'RESEARCH',
  'news-researcher': 'NEWS',
  'saas-disruption-researcher': 'MARKETS',
  'vibe-coding-researcher': 'TOOLS',
  'hn-researcher': 'HACKER NEWS',
  'reddit-researcher': 'REDDIT',
  'skill-finder': 'SKILLS',
  'github-pulse-researcher': 'TOOLS',
  'thought-leaders-researcher': 'VOICES',
  'sources-researcher': 'SOURCES',
  'projects-researcher': 'PROJECTS',
  'rss-researcher': 'DISPATCH',
}

export function sectionLabel(agent: string): string {
  return (
    SECTION[agent] ??
    agent.replace(/-(researcher|finder|pulse)$/, '').replace(/[-_]/g, ' ').toUpperCase()
  )
}

/**
 * Clean, consistent source label. Many `source_name`s are
 * "Publisher — Article Title (2026)"; show just the publisher (or the domain).
 */
export function sourceLabel(name: string | null, url: string | null): string {
  if (name) {
    const cut = name.split(/\s+[—–|]\s+|\s+-\s+/)[0].trim()
    const clean = cut.replace(/\s*\(20\d\d\)\s*$/, '').trim()
    if (clean) return clean
  }
  if (url) {
    try {
      return new URL(url).hostname.replace(/^www\./, '')
    } catch {
      /* ignore */
    }
  }
  return 'web'
}

export function sourceDomain(url: string | null): string | null {
  if (!url) return null
  try {
    return new URL(url).hostname.replace(/^www\./, '').toLowerCase()
  } catch {
    return null
  }
}

const RESERVED = new Set([
  'i', 'home', 'search', 'status', 'intent', 'share', 'hashtag', 'explore', 'about',
])

export type Leader = { name: string; avatar: string; platform: string }

/** Extract a "via {person}" leader from a social source URL (real avatar via unavatar). */
export function leaderFrom(sourceUrl: string | null): Leader | null {
  if (!sourceUrl) return null
  let u: URL
  try {
    u = new URL(sourceUrl)
  } catch {
    return null
  }
  const host = u.hostname.replace(/^www\./, '')
  const parts = u.pathname.split('/').filter(Boolean)

  if ((host === 'x.com' || host === 'twitter.com') && parts[0] && !RESERVED.has(parts[0].toLowerCase())) {
    const h = parts[0]
    return { name: `@${h}`, avatar: `https://unavatar.io/x/${h}`, platform: 'x' }
  }
  if (host === 'bsky.app' && parts[0] === 'profile' && parts[1]) {
    return { name: parts[1].replace(/\.bsky\.social$/, ''), avatar: `https://unavatar.io/bluesky/${parts[1]}`, platform: 'bluesky' }
  }
  return null
}
