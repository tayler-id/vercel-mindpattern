import { describe, expect, it, vi } from 'vitest'

const api = vi.hoisted(() => ({ backendFetch: vi.fn() }))
vi.mock('@/lib/api', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/api')>()),
  ...api,
}))

import sitemap from './sitemap'

/**
 * 2026-08-26: the live sitemap served 187 URLs while the backend knew about
 * 6,806 stories, 84 entities, 18 sources and 184 briefings. Both backend calls
 * were wrapped in `catch { graph = null }`, so a slow backend silently produced
 * a sitemap of static routes only, and `revalidate = 3600` then pinned that
 * gutted version for an hour. Google was told the site had 187 pages instead of
 * roughly 7,000.
 *
 * A sitemap that cannot see the corpus must fail the render. Next then keeps
 * serving the last good sitemap instead of caching a broken one, which is the
 * same rule the story pages follow.
 */

const graph = {
  kind: 'site_sitemap',
  stories: [{ slug: 'a-story', issue_date: '2026-08-25' }],
  entities: ['openai'],
  sources: ['arxiv.org'],
  briefings: ['2026-08-25'],
}

describe('sitemap degradation', () => {
  it('throws rather than emitting a corpus-less sitemap', async () => {
    api.backendFetch.mockRejectedValue(new Error('aborted after 10000ms'))
    await expect(sitemap()).rejects.toThrow()
  })

  it('throws when the graph call fails even if reports succeed', async () => {
    api.backendFetch.mockImplementation(async (path: string) =>
      path === '/api/reports' ? [] : Promise.reject(new Error('timeout')),
    )
    await expect(sitemap()).rejects.toThrow()
  })

  it('throws when the graph comes back with no stories at all', async () => {
    // An empty corpus is not a real state for this site. Treat it as a failure
    // rather than publishing a sitemap that de-indexes 6,806 pages.
    api.backendFetch.mockImplementation(async (path: string) =>
      path === '/api/reports' ? [] : { ...graph, stories: [] },
    )
    await expect(sitemap()).rejects.toThrow()
  })

  it('emits the full corpus on the happy path', async () => {
    api.backendFetch.mockImplementation(async (path: string) =>
      path === '/api/reports' ? [] : graph,
    )

    const entries = await sitemap()
    const urls = entries.map((e) => e.url)

    expect(urls.some((u) => u.includes('/s/a-story'))).toBe(true)
    expect(urls.some((u) => u.includes('/e/openai'))).toBe(true)
    expect(urls.some((u) => u.includes('/source/arxiv.org'))).toBe(true)
    expect(urls.some((u) => u === 'https://mindpattern.ai/')).toBe(true)
  })

  it('a missing reports list alone does not sink the sitemap', async () => {
    // /api/reports only adds blog-date routes. The corpus is what matters.
    api.backendFetch.mockImplementation(async (path: string) =>
      path === '/api/reports' ? Promise.reject(new Error('slow')) : graph,
    )

    const entries = await sitemap()
    expect(entries.some((e) => e.url.includes('/s/a-story'))).toBe(true)
  })
})
