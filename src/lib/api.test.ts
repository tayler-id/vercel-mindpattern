import { beforeEach, describe, expect, it, vi } from 'vitest'

type FetchMock = ReturnType<typeof vi.fn>

async function importApiWithBackend(url = 'https://backend.test') {
  vi.resetModules()
  vi.stubEnv('BACKEND_API_URL', url)
  return import('./api')
}

function mockJsonResponse(data: unknown, init: { ok?: boolean; status?: number } = {}) {
  return {
    ok: init.ok ?? true,
    status: init.status ?? 200,
    json: vi.fn().mockResolvedValue(data),
  }
}

describe('backendFetch', () => {
  let fetchMock: FetchMock

  beforeEach(() => {
    fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
  })

  it('fetches JSON from the configured backend with non-empty params', async () => {
    fetchMock.mockResolvedValue(mockJsonResponse({ ok: true }))
    const { backendFetch } = await importApiWithBackend()

    await expect(
      backendFetch('/api/findings', { limit: '10', empty: '', agent: 'news' }),
    ).resolves.toEqual({ ok: true })

    expect(fetchMock).toHaveBeenCalledWith(
      'https://backend.test/api/findings?limit=10&agent=news',
      {
        next: { revalidate: 60 },
        signal: expect.any(AbortSignal),
      },
    )
  })

  it('throws with the backend status for non-OK responses', async () => {
    fetchMock.mockResolvedValue(mockJsonResponse({ error: true }, { ok: false, status: 503 }))
    const { backendFetch } = await importApiWithBackend()

    await expect(backendFetch('/api/stats')).rejects.toThrow('Backend 503: /api/stats')
  })
})

describe('backendAssetUrl', () => {
  it('resolves assets against the configured backend URL', async () => {
    const { backendAssetUrl } = await importApiWithBackend('https://assets.test/base/')

    expect(backendAssetUrl('/audio/today.mp3')).toBe('https://assets.test/audio/today.mp3')
  })
})

describe('typed backend helpers', () => {
  let fetchMock: FetchMock

  beforeEach(() => {
    fetchMock = vi.fn().mockResolvedValue(mockJsonResponse({ ok: true }))
    vi.stubGlobal('fetch', fetchMock)
  })

  it('builds finding, feed, story, trend, popular, report, audio, source, related, and arc requests', async () => {
    const api = await importApiWithBackend()

    await api.getStats()
    await api.getFindings({ limit: 2, offset: 4, agent: 'news', importance: 'high' })
    await api.getFeed({ limit: 3, offset: 6, date: '2026-07-02', since: '2026-07-01' })
    await api.getStories({ limit: 5, offset: 1 })
    await api.getStory('a story')
    await api.getTrending()
    await api.getTrending({ limit: 9 })
    await api.getPopular()
    await api.getPopular({ window: '7d', limit: 11 })
    await api.getReports()
    await api.getReport('2026-07-02')
    await api.getAudioBriefings()
    await api.getAudioBriefing('2026-07-02')
    await api.getStructuredIssue('2026-07-02')
    await api.getEntity('open ai')
    await api.getSources({ limit: 12 })
    await api.getRelated(42, { limit: 7 })
    await api.getNarrativeArc('arc one', '2026-07-02')

    const urls = fetchMock.mock.calls.map(([url]) => String(url))
    expect(urls).toContain('https://backend.test/api/stats')
    expect(urls).toContain('https://backend.test/api/findings?limit=2&offset=4&agent=news&importance=high')
    expect(urls).toContain('https://backend.test/api/feed?user=ramsay&limit=3&offset=6&date=2026-07-02&since=2026-07-01')
    expect(urls).toContain('https://backend.test/api/stories?user=ramsay&limit=5&offset=1')
    expect(urls).toContain('https://backend.test/api/stories/a%20story?user=ramsay')
    expect(urls).toContain('https://backend.test/api/trending?user=ramsay&limit=30')
    expect(urls).toContain('https://backend.test/api/trending?user=ramsay&limit=9')
    expect(urls).toContain('https://backend.test/api/popular?user=ramsay&window=all&limit=30')
    expect(urls).toContain('https://backend.test/api/popular?user=ramsay&window=7d&limit=11')
    expect(urls).toContain('https://backend.test/api/reports?user=ramsay')
    expect(urls).toContain('https://backend.test/api/reports/2026-07-02?user=ramsay')
    expect(urls).toContain('https://backend.test/api/audio-briefings?user=ramsay')
    expect(urls).toContain('https://backend.test/api/audio-briefings/2026-07-02?user=ramsay')
    expect(urls).toContain('https://backend.test/api/issues/2026-07-02/structured?user=ramsay')
    expect(urls).toContain('https://backend.test/api/entities/open%20ai?user=ramsay&limit=40')
    expect(urls).toContain('https://backend.test/api/sources?limit=12')
    expect(urls).toContain('https://backend.test/api/related/42?user=ramsay&mode=blended&limit=7')
    expect(urls).toContain('https://backend.test/api/narrative-arcs/arc%20one?user=ramsay&date=2026-07-02')
  })

  it('returns null or empty fallback values for recoverable backend failures', async () => {
    fetchMock.mockResolvedValue(mockJsonResponse({}, { ok: false, status: 500 }))
    const api = await importApiWithBackend()

    await expect(api.getStory('missing')).resolves.toBeNull()
    await expect(api.getAudioBriefing('2026-07-02')).resolves.toBeNull()
    await expect(api.getStructuredIssue('2026-07-02')).resolves.toBeNull()
    await expect(api.getEntity('missing')).resolves.toBeNull()
    await expect(api.getFinding(1)).resolves.toBeNull()
    await expect(api.getRelated(1)).resolves.toEqual({
      kind: 'related',
      finding_id: 1,
      mode: 'semantic',
      items: [],
      total: 0,
    })
    await expect(api.getNarrativeArc('arc')).resolves.toBeNull()
    await expect(api.getNarrativeArc('arc', '2026-07-02')).resolves.toBeNull()
  })

  it('normalizes source responses and falls back to source list lookup', async () => {
    fetchMock
      .mockResolvedValueOnce(
        mockJsonResponse({
          domain: 'Example.com',
          counts: { findings: 4 },
          findings: ['a', 'b', 'c'],
        }),
      )
      .mockResolvedValueOnce(mockJsonResponse({}, { ok: false, status: 404 }))
      .mockResolvedValueOnce(
        mockJsonResponse([
          { url_domain: 'example.org', display_name: 'Example Org' },
          { url_domain: 'target.com', display_name: 'Target' },
        ]),
      )

    const api = await importApiWithBackend()
    await expect(api.getSourceByDomain('Example.com')).resolves.toMatchObject({
      url_domain: 'Example.com',
      hit_count: 4,
      high_value_count: 0,
      last_seen: '',
      display_name: 'Example.com',
    })
    await expect(api.getSourceByDomain('www.target.com')).resolves.toMatchObject({
      url_domain: 'target.com',
    })
  })

  it('returns source findings when available and an empty list otherwise', async () => {
    fetchMock
      .mockResolvedValueOnce(mockJsonResponse({ findings: [1, 2, 3] }))
      .mockResolvedValueOnce(mockJsonResponse({}))

    const api = await importApiWithBackend()
    await expect(api.getFindingsForSource('example.com', { limit: 2 })).resolves.toEqual([1, 2])
    await expect(api.getFindingsForSource('empty.com')).resolves.toEqual([])
  })

  it('falls back from the plural finding endpoint to the singular endpoint', async () => {
    fetchMock
      .mockResolvedValueOnce(mockJsonResponse({}, { ok: false, status: 404 }))
      .mockResolvedValueOnce(mockJsonResponse({ id: 7 }))

    const api = await importApiWithBackend()
    await expect(api.getFinding(7)).resolves.toEqual({ id: 7 })
  })
})
