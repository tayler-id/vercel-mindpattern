import { beforeEach, describe, expect, it, vi } from 'vitest'

const backendFetch = vi.fn()

vi.mock('@/lib/api', () => ({
  backendFetch,
}))

describe('sitemap metadata', () => {
  beforeEach(() => {
    backendFetch.mockReset()
  })

  it('combines static routes, reports, and graph-backed public routes', async () => {
    backendFetch
      .mockResolvedValueOnce([{ date: '2026-07-01' }])
      .mockResolvedValueOnce({
        stories: [{ slug: 'story-one', issue_date: '2026-07-02' }, { slug: 'story-two' }],
        briefings: ['2026-07-02'],
        entities: ['openai'],
        sources: ['example.com'],
      })
    const { default: sitemap, revalidate } = await import('./sitemap')

    const entries = await sitemap()
    const urls = entries.map((entry) => entry.url)

    expect(revalidate).toBe(3600)
    expect(backendFetch).toHaveBeenNthCalledWith(1, '/api/reports', { user: 'ramsay' })
    expect(backendFetch).toHaveBeenNthCalledWith(2, '/api/site/sitemap', { user: 'ramsay' })
    expect(urls).toEqual(
      expect.arrayContaining([
        'https://mindpattern.ai/',
        'https://mindpattern.ai/briefings',
        'https://mindpattern.ai/blog',
        'https://mindpattern.ai/explore',
        'https://mindpattern.ai/research/agentic-evals',
        'https://mindpattern.ai/blog/2026-07-01',
        'https://mindpattern.ai/s/story-one',
        'https://mindpattern.ai/s/story-two',
        'https://mindpattern.ai/briefings/2026-07-02',
        'https://mindpattern.ai/e/openai',
        'https://mindpattern.ai/source/example.com',
      ]),
    )
    expect(entries.find((entry) => entry.url.endsWith('/s/story-one'))?.lastModified).toEqual(
      new Date('2026-07-02'),
    )
    expect(entries.find((entry) => entry.url.endsWith('/s/story-two'))?.lastModified).toBeUndefined()
  })

  it('returns static routes when backend lookups fail', async () => {
    backendFetch.mockRejectedValue(new Error('backend down'))
    const { default: sitemap } = await import('./sitemap')

    const entries = await sitemap()

    expect(entries.map((entry) => entry.url)).toEqual([
      'https://mindpattern.ai/',
      'https://mindpattern.ai/briefings',
      'https://mindpattern.ai/blog',
      'https://mindpattern.ai/explore',
      'https://mindpattern.ai/work',
      'https://mindpattern.ai/research/agentic-evals',
    ])
  })
})
