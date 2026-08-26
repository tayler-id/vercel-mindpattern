import { describe, expect, it } from 'vitest'
import robots from './robots'

// Uncapped AI-crawler sweeps of the full-archive sitemap were a real outage
// vector, so every rule carries the same crawl delay as well as the allow list.
const CRAWL_RULES = {
  allow: '/',
  disallow: ['/api/', '/_next/'],
  crawlDelay: 10,
}

describe('robots metadata', () => {
  it('allows pages for readers and AI agents while blocking internal routes', () => {
    const metadata = robots()

    expect(metadata.sitemap).toBe('https://mindpattern.ai/sitemap.xml')
    expect(metadata.host).toBe('https://mindpattern.ai')
    expect(metadata.rules).toContainEqual({ userAgent: '*', ...CRAWL_RULES })
    expect(metadata.rules).toContainEqual({ userAgent: 'GPTBot', ...CRAWL_RULES })
    expect(metadata.rules).toContainEqual({ userAgent: 'Claude-SearchBot', ...CRAWL_RULES })
  })

  it('names each agent once, so no rule silently shadows another', () => {
    const agents = (robots().rules as { userAgent: string }[]).map((rule) => rule.userAgent)

    expect(agents).toEqual([...new Set(agents)])
  })
})
