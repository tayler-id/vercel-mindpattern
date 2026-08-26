import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

type FetchMock = ReturnType<typeof vi.fn>

const STATS = { findings: 42 }
const REPORTS = [{ date: '2026-06-01' }, { date: '2026-07-02' }]
// Latest report date + findings count, the key detail fetches cache under.
const VERSION = '2026-07-02.42'

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

function isStatsUrl(url: string) {
  return url.startsWith('https://backend.test/api/stats')
}

function isReportListUrl(url: string) {
  return url.startsWith('https://backend.test/api/reports?')
}

// Routes the two content-version lookups by URL so tests can queue responses
// for the endpoint they actually care about.
function routingFetchMock(
  handler: (url: string) => unknown,
  opts: { stats?: unknown; reports?: unknown } = {},
) {
  return vi.fn(async (input: unknown) => {
    const url = String(input)
    if (isStatsUrl(url)) return opts.stats ?? mockJsonResponse(STATS)
    if (isReportListUrl(url)) return opts.reports ?? mockJsonResponse(REPORTS)
    return handler(url)
  })
}

function queuedResponses(responses: unknown[]) {
  let index = 0
  return () => responses[Math.min(index++, responses.length - 1)]
}

function callsMatching(fetchMock: FetchMock, predicate: (url: string) => boolean) {
  return fetchMock.mock.calls.filter(([url]) => predicate(String(url)))
}

function initOf(fetchMock: FetchMock, predicate: (url: string) => boolean) {
  const call = callsMatching(fetchMock, predicate).at(-1)
  return (call?.[1] ?? {}) as { next?: { revalidate?: number } }
}

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllEnvs()
})

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
        next: { revalidate: 300 },
        signal: expect.any(AbortSignal),
      },
    )
  })

  it('honours an explicit revalidate window', async () => {
    fetchMock.mockResolvedValue(mockJsonResponse({ ok: true }))
    const { backendFetch } = await importApiWithBackend()

    await backendFetch('/api/stats', undefined, { revalidate: 30 })

    expect(fetchMock.mock.calls[0][1]).toMatchObject({ next: { revalidate: 30 } })
  })

  it('throws with the backend status for non-OK responses', async () => {
    fetchMock.mockResolvedValue(mockJsonResponse({ error: true }, { ok: false, status: 503 }))
    const { backendFetch } = await importApiWithBackend()

    await expect(backendFetch('/api/stats')).rejects.toThrow('Backend 503: /api/stats')
  })
})

describe('backend error kinds', () => {
  let fetchMock: FetchMock

  beforeEach(() => {
    fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
  })

  it('tags a 404 as not_found and nothing else', async () => {
    fetchMock.mockResolvedValue(mockJsonResponse({}, { ok: false, status: 404 }))
    const api = await importApiWithBackend()

    const err = await api.backendFetch('/api/stats').catch((e) => e)
    expect(err).toBeInstanceOf(api.BackendError)
    expect(err.kind).toBe('not_found')
    expect(err.status).toBe(404)
    expect(err.path).toBe('/api/stats')
    expect(api.isBackendNotFound(err)).toBe(true)
    expect(api.isBackendUnreachable(err)).toBe(false)
  })

  it('tags a 5xx as http and still calls it unreachable', async () => {
    // Fly's proxy failing to place a request ("could not find a good candidate
    // within 40 attempts") arrives as a 502, and the render paths branch on
    // isBackendUnreachable. Excluding http here left the story page a bare 500.
    fetchMock.mockResolvedValue(mockJsonResponse({}, { ok: false, status: 502 }))
    const api = await importApiWithBackend()

    const err = await api.backendFetch('/api/stats').catch((e) => e)
    expect(err.kind).toBe('http')
    expect(api.isBackendNotFound(err)).toBe(false)
    expect(api.isBackendUnreachable(err)).toBe(true)
    await expect(api.backendOutcome(async () => { throw err })).resolves.toMatchObject({
      status: 'unavailable',
    })
  })

  it('tags an aborted request as timeout, with the abort as the cause', async () => {
    const abort = new DOMException('aborted', 'TimeoutError')
    fetchMock.mockRejectedValue(abort)
    const api = await importApiWithBackend()

    const err = await api.backendFetch('/api/stories/one').catch((e) => e)
    expect(err.kind).toBe('timeout')
    expect(err.status).toBe(0)
    expect(err.cause).toBe(abort)
    expect(err.message).toMatch(/^Backend timed out after \d+ms: \/api\/stories\/one$/)
    expect(api.isBackendUnreachable(err)).toBe(true)
  })

  it('tags an external abort as timeout too', async () => {
    fetchMock.mockRejectedValue(new DOMException('aborted', 'AbortError'))
    const api = await importApiWithBackend()

    const err = await api.backendFetch('/api/stats').catch((e) => e)
    expect(err.kind).toBe('timeout')
  })

  it('tags a socket failure as network', async () => {
    fetchMock.mockRejectedValue(new TypeError('fetch failed'))
    const api = await importApiWithBackend()

    const err = await api.backendFetch('/api/stats').catch((e) => e)
    expect(err.kind).toBe('network')
    expect(err.message).toBe('Backend unreachable: /api/stats')
    expect(api.isBackendUnreachable(err)).toBe(true)
  })

  it('tags a body that never finishes as network, not as an empty 200', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: vi.fn().mockRejectedValue(new Error('terminated')),
    })
    const api = await importApiWithBackend()

    const err = await api.backendFetch('/api/stats').catch((e) => e)
    expect(err.kind).toBe('network')
    expect(api.isBackendUnreachable(err)).toBe(true)
  })

  it('keeps the two-argument constructor callers use for synthetic 404s', async () => {
    const { BackendError, isBackendNotFound, isBackendUnreachable } = await importApiWithBackend()

    const err = new BackendError(404, '/api/reports/2026-07-02')
    expect(err.message).toBe('Backend 404: /api/reports/2026-07-02')
    expect(isBackendNotFound(err)).toBe(true)
    expect(isBackendNotFound(new Error('Backend 404: nope'))).toBe(false)
    expect(isBackendUnreachable(new Error('boom'))).toBe(false)
  })
})

describe('backendOutcome', () => {
  let fetchMock: FetchMock

  beforeEach(() => {
    fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
  })

  it('separates a loaded payload, a missing one, and an unreachable backend', async () => {
    fetchMock.mockImplementation(routingFetchMock(() => mockJsonResponse({ slug: 'one' })))
    const api = await importApiWithBackend()

    await expect(api.backendOutcome(() => api.getStory('one'))).resolves.toEqual({
      status: 'ok',
      data: { slug: 'one' },
    })
    await expect(api.backendOutcome(async () => null)).resolves.toEqual({ status: 'missing' })

    const notFound = await api.backendOutcome(async () => {
      throw new api.BackendError(404, '/api/stories/gone')
    })
    expect(notFound).toEqual({ status: 'missing' })

    const down = await api.backendOutcome(async () => {
      throw new api.BackendError(503, '/api/stories/one')
    })
    expect(down.status).toBe('unavailable')
    expect(down).toMatchObject({ error: { kind: 'http', status: 503 } })
  })

  it('wraps a transport throw as unavailable', async () => {
    const api = await importApiWithBackend()

    const outcome = await api.backendOutcome(async () => {
      throw new TypeError('fetch failed')
    })
    expect(outcome.status).toBe('unavailable')
    expect(outcome).toMatchObject({ error: { kind: 'network' } })
  })

  it('lets a notFound() pass straight through instead of relabelling it', async () => {
    // notFound() and redirect() throw an Error carrying a digest. Swallowing
    // one turns the caller's notFound() into a degraded page that never 404s.
    const api = await importApiWithBackend()
    const navigation = Object.assign(new Error('NEXT_HTTP_ERROR_FALLBACK;404'), {
      digest: 'NEXT_HTTP_ERROR_FALLBACK;404',
    })

    await expect(
      api.backendOutcome(async () => {
        throw navigation
      }),
    ).rejects.toBe(navigation)
  })

  it('rethrows an ordinary bug rather than blaming the backend for it', async () => {
    const api = await importApiWithBackend()
    const bug = new RangeError('invalid array length')

    await expect(
      api.backendOutcome(async () => {
        throw bug
      }),
    ).rejects.toBe(bug)
  })
})

describe('content version', () => {
  let fetchMock: FetchMock

  beforeEach(() => {
    fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
  })

  it('looks the version up once for a burst of detail fetches', async () => {
    fetchMock.mockImplementation(routingFetchMock(() => mockJsonResponse({ ok: true })))
    const api = await importApiWithBackend()

    await Promise.all([
      api.getStory('one'),
      api.getStory('two'),
      api.getReport('2026-07-02'),
      api.getFinding(7),
    ])
    await api.getStory('three')

    expect(callsMatching(fetchMock, isStatsUrl)).toHaveLength(1)
    expect(callsMatching(fetchMock, isReportListUrl)).toHaveLength(1)
  })

  it('stamps the version on detail requests and caches them for a day', async () => {
    fetchMock.mockImplementation(routingFetchMock(() => mockJsonResponse({ ok: true })))
    const api = await importApiWithBackend()

    await api.getStory('one')

    const [url, init] = fetchMock.mock.calls.at(-1) as [string, { next: { revalidate: number } }]
    expect(String(url)).toBe(`https://backend.test/api/stories/one?user=ramsay&v=${VERSION}`)
    expect(init.next.revalidate).toBe(86_400)
  })

  it('drops the version key and caches for a minute when the lookup times out', async () => {
    const never = new Promise(() => {})
    fetchMock.mockImplementation((input: unknown) => {
      const url = String(input)
      if (isStatsUrl(url) || isReportListUrl(url)) return never
      return Promise.resolve(mockJsonResponse({ ok: true }))
    })
    const api = await importApiWithBackend()
    vi.useFakeTimers()

    const pending = api.getReport('2026-07-02')
    await vi.advanceTimersByTimeAsync(3_000)
    await expect(pending).resolves.toEqual({ ok: true })

    const isDetail = (url: string) => url.includes('/api/reports/2026-07-02')
    expect(String(callsMatching(fetchMock, isDetail).at(-1)?.[0])).toBe(
      'https://backend.test/api/reports/2026-07-02?user=ramsay',
    )
    // The old code cached this under a shared 'unversioned' key for 24 hours.
    expect(initOf(fetchMock, isDetail).next?.revalidate).toBe(60)
  })

  it('settles one render pass on one key instead of splitting it in two', async () => {
    // Next runs generateMetadata alongside the page render. When the second
    // caller took a bare key immediately, the same story was fetched twice,
    // once under ?v= for a day and once bare for a minute.
    fetchMock.mockImplementation(routingFetchMock(() => mockJsonResponse({ ok: true })))
    const api = await importApiWithBackend()

    const [, ,] = await Promise.all([api.getStory('one'), api.getStory('two')])

    expect(callsMatching(fetchMock, isStatsUrl)).toHaveLength(1)
    const keys = callsMatching(fetchMock, (u) => u.includes('/api/stories/')).map(([url]) =>
      String(url),
    )
    expect(keys).toEqual([
      `https://backend.test/api/stories/one?user=ramsay&v=${VERSION}`,
      `https://backend.test/api/stories/two?user=ramsay&v=${VERSION}`,
    ])
  })

  it('gives a late caller only the time left on the shared deadline', async () => {
    const never = new Promise(() => {})
    fetchMock.mockImplementation((input: unknown) => {
      const url = String(input)
      if (isStatsUrl(url) || isReportListUrl(url)) return never
      return Promise.resolve(mockJsonResponse({ ok: true }))
    })
    const api = await importApiWithBackend()
    vi.useFakeTimers()

    const first = api.getStory('one')
    const second = api.getStory('two')
    await vi.advanceTimersByTimeAsync(3_000)
    await expect(first).resolves.toEqual({ ok: true })
    await expect(second).resolves.toEqual({ ok: true })

    // One lookup for the pass, and neither render waited past the 3s budget.
    expect(callsMatching(fetchMock, isStatsUrl)).toHaveLength(1)
    expect(String(callsMatching(fetchMock, (u) => u.includes('/api/stories/two')).at(-1)?.[0])).toBe(
      'https://backend.test/api/stories/two?user=ramsay',
    )
  })

  it('backs off instead of re-asking a backend that just failed', async () => {
    fetchMock.mockImplementation(
      routingFetchMock(() => mockJsonResponse({ ok: true }), {
        stats: mockJsonResponse({}, { ok: false, status: 500 }),
      }),
    )
    const api = await importApiWithBackend()

    await api.getStory('one')
    await api.getStory('two')
    await api.getStory('three')

    expect(callsMatching(fetchMock, isStatsUrl)).toHaveLength(1)
    const isDetail = (url: string) => url.includes('/api/stories/three')
    expect(String(callsMatching(fetchMock, isDetail).at(-1)?.[0])).toBe(
      'https://backend.test/api/stories/three?user=ramsay',
    )
    expect(initOf(fetchMock, isDetail).next?.revalidate).toBe(60)
  })

  it('serves the last known version while a stale one refreshes in the background', async () => {
    fetchMock.mockImplementation(routingFetchMock(() => mockJsonResponse({ ok: true })))
    const api = await importApiWithBackend()

    await api.getStory('one')
    // Past the 60s memo window, so the next call takes the stale path.
    vi.spyOn(Date, 'now').mockReturnValue(Date.now() + 120_000)
    await api.getStory('two')

    expect(callsMatching(fetchMock, isStatsUrl)).toHaveLength(2)
    expect(String(callsMatching(fetchMock, (u) => u.includes('/api/stories/two')).at(-1)?.[0])).toBe(
      `https://backend.test/api/stories/two?user=ramsay&v=${VERSION}`,
    )
    vi.mocked(Date.now).mockRestore()
  })

  it('runs one background refresh even when several stale renders ask at once', async () => {
    fetchMock.mockImplementation(routingFetchMock(() => mockJsonResponse({ ok: true })))
    const api = await importApiWithBackend()
    await api.getStory('one')

    const never = new Promise(() => {})
    fetchMock.mockImplementation((input: unknown) => {
      const url = String(input)
      if (isStatsUrl(url) || isReportListUrl(url)) return never
      return Promise.resolve(mockJsonResponse({ ok: true }))
    })
    vi.spyOn(Date, 'now').mockReturnValue(Date.now() + 120_000)
    await Promise.all([api.getStory('two'), api.getStory('three'), api.getStory('four')])

    // One lookup for the first render, one refresh shared by the stale three.
    expect(callsMatching(fetchMock, isStatsUrl)).toHaveLength(2)
    vi.mocked(Date.now).mockRestore()
  })

  it('keeps the last known version when a refresh fails', async () => {
    // /api/stats took 23.8s against a 10s budget on 2026-08-23, so the refresh
    // could never succeed. Dropping the key on failure took every detail path
    // from one backend fetch a day to one a minute, at the box already down.
    fetchMock.mockImplementation(routingFetchMock(() => mockJsonResponse({ ok: true })))
    const api = await importApiWithBackend()
    await api.getStory('one')

    fetchMock.mockImplementation(
      routingFetchMock(() => mockJsonResponse({ ok: true }), {
        stats: mockJsonResponse({}, { ok: false, status: 503 }),
      }),
    )
    // Past the 60s memo window: the stale path refreshes behind the render.
    const nowSpy = vi.spyOn(Date, 'now').mockReturnValue(Date.now() + 120_000)
    await api.getStory('two')
    // Let the background refresh fail before the next read of the cache.
    await new Promise((resolve) => setTimeout(resolve, 0))
    await api.getStory('three')
    nowSpy.mockRestore()

    const isThree = (url: string) => url.includes('/api/stories/three')
    expect(String(callsMatching(fetchMock, isThree).at(-1)?.[0])).toBe(
      `https://backend.test/api/stories/three?user=ramsay&v=${VERSION}`,
    )
    expect(initOf(fetchMock, isThree).next?.revalidate).toBe(86_400)
  })

  it('reports no version when there are no reports yet', async () => {
    fetchMock.mockImplementation(
      routingFetchMock(() => mockJsonResponse({ ok: true }), { reports: mockJsonResponse([]) }),
    )
    const api = await importApiWithBackend()

    await api.getStory('one')

    expect(String(fetchMock.mock.calls.at(-1)?.[0])).toBe(
      'https://backend.test/api/stories/one?user=ramsay&v=none.42',
    )
  })
})

describe('backendAssetUrl', () => {
  it('resolves assets against the configured backend URL', async () => {
    const { backendAssetUrl } = await importApiWithBackend('https://assets.test/base/')

    expect(backendAssetUrl('/audio/today.mp3')).toBe('https://assets.test/audio/today.mp3')
  })

  it('falls back to the production backend when no URL is configured', async () => {
    const { backendAssetUrl } = await importApiWithBackend('')

    expect(backendAssetUrl('/audio/today.mp3')).toBe('https://mindpattern.fly.dev/audio/today.mp3')
  })
})

describe('BACKEND_FETCH_TIMEOUT_MS', () => {
  it('names the configured budget in the timeout message', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new DOMException('aborted', 'TimeoutError')))
    vi.stubEnv('BACKEND_FETCH_TIMEOUT_MS', '2500')
    const api = await importApiWithBackend()

    const err = await api.backendFetch('/api/stats').catch((e) => e)
    expect(err.message).toBe('Backend timed out after 2500ms: /api/stats')
  })
})

describe('typed backend helpers', () => {
  let fetchMock: FetchMock

  beforeEach(() => {
    fetchMock = vi.fn(routingFetchMock(() => mockJsonResponse({ ok: true })))
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
    expect(urls).toContain(`https://backend.test/api/stories/a%20story?user=ramsay&v=${VERSION}`)
    expect(urls).toContain('https://backend.test/api/trending?user=ramsay&limit=30')
    expect(urls).toContain('https://backend.test/api/trending?user=ramsay&limit=9')
    expect(urls).toContain('https://backend.test/api/popular?user=ramsay&window=all&limit=30')
    expect(urls).toContain('https://backend.test/api/popular?user=ramsay&window=7d&limit=11')
    expect(urls).toContain('https://backend.test/api/reports?user=ramsay')
    expect(urls).toContain(`https://backend.test/api/reports/2026-07-02?user=ramsay&v=${VERSION}`)
    expect(urls).toContain('https://backend.test/api/audio-briefings?user=ramsay')
    expect(urls).toContain(`https://backend.test/api/audio-briefings/2026-07-02?user=ramsay&v=${VERSION}`)
    expect(urls).toContain(`https://backend.test/api/issues/2026-07-02/structured?user=ramsay&v=${VERSION}`)
    expect(urls).toContain(`https://backend.test/api/entities/open%20ai?user=ramsay&limit=40&v=${VERSION}`)
    expect(urls).toContain('https://backend.test/api/sources?limit=12')
    expect(urls).toContain(`https://backend.test/api/related/42?user=ramsay&mode=blended&limit=7&v=${VERSION}`)
    expect(urls).toContain('https://backend.test/api/narrative-arcs/arc%20one?user=ramsay&date=2026-07-02')
  })

  it('rethrows an unreachable backend from getStory so the page never caches a 404', async () => {
    fetchMock.mockImplementation(
      routingFetchMock(() => mockJsonResponse({}, { ok: false, status: 500 })),
    )
    const api = await importApiWithBackend()

    const err = await api.getStory('one').catch((e) => e)
    expect(api.isBackendUnreachable(err)).toBe(true)
    expect(err.kind).toBe('http')
    await expect(api.getEntity('one')).rejects.toBeInstanceOf(api.BackendError)
  })

  it('returns null for a story or entity the backend does not have', async () => {
    fetchMock.mockImplementation(
      routingFetchMock(() => mockJsonResponse({}, { ok: false, status: 404 })),
    )
    const api = await importApiWithBackend()

    await expect(api.getStory('missing')).resolves.toBeNull()
    await expect(api.getEntity('missing')).resolves.toBeNull()
    await expect(api.getFinding(1)).resolves.toBeNull()
  })

  it('answers null or an empty payload for a 404, and only for a 404', async () => {
    fetchMock.mockImplementation(
      routingFetchMock(() => mockJsonResponse({}, { ok: false, status: 404 })),
    )
    const api = await importApiWithBackend()

    await expect(api.getAudioBriefing('2026-07-02')).resolves.toBeNull()
    await expect(api.getStructuredIssue('2026-07-02')).resolves.toBeNull()
    await expect(api.getRelated(1)).resolves.toEqual(api.emptyRelated(1))
    await expect(api.getNarrativeArc('arc')).resolves.toBeNull()
    await expect(api.getNarrativeArc('arc', '2026-07-02')).resolves.toBeNull()
  })

  it('rethrows a degraded backend from every fragment helper', async () => {
    // These four used to swallow a timeout and answer null, so backendOutcome
    // reported "missing" for a box that was merely slow, and a caller acting
    // on that cached a 404 over real content.
    fetchMock.mockImplementation(
      routingFetchMock(() => mockJsonResponse({}, { ok: false, status: 500 })),
    )
    const api = await importApiWithBackend()

    await expect(api.getAudioBriefing('2026-07-02')).rejects.toMatchObject({ kind: 'http' })
    await expect(api.getStructuredIssue('2026-07-02')).rejects.toMatchObject({ kind: 'http' })
    await expect(api.getRelated(1)).rejects.toMatchObject({ kind: 'http' })
    await expect(api.getNarrativeArc('arc', '2026-07-02')).rejects.toMatchObject({ kind: 'http' })
    await expect(api.backendOutcome(() => api.getStructuredIssue('2026-07-02'))).resolves.toMatchObject(
      { status: 'unavailable' },
    )
  })

  it('separates a listed date, an absent one, and a list that never arrived', async () => {
    fetchMock.mockImplementation(routingFetchMock(() => mockJsonResponse({ ok: true })))
    const api = await importApiWithBackend()

    await expect(api.lookupArchive('2026-07-02')).resolves.toMatchObject({ state: 'listed' })
    await expect(api.lookupArchive('2026-07-03')).resolves.toMatchObject({ state: 'absent' })

    fetchMock.mockImplementation(() =>
      Promise.resolve(mockJsonResponse({}, { ok: false, status: 500 })),
    )
    await expect(api.lookupArchive('2026-07-02')).resolves.toMatchObject({ state: 'unreachable' })
  })

  it('reads an empty list as a degraded box for a recent date, and as a gap otherwise', async () => {
    // /api/reports answers [] with a 200 only when the reports directory is
    // missing. Treating every [] as degraded turned the whole back catalogue
    // into 200 retry pages; bounding it keeps old gaps a real 404.
    fetchMock.mockImplementation(
      routingFetchMock(() => mockJsonResponse({ ok: true }), { reports: mockJsonResponse([]) }),
    )
    const api = await importApiWithBackend()
    const today = new Date().toISOString().slice(0, 10)

    await expect(api.lookupArchive(today)).resolves.toMatchObject({ state: 'unreachable' })
    await expect(api.lookupArchive('2019-01-01')).resolves.toMatchObject({ state: 'absent' })
    await expect(api.lookupArchive('not-a-date')).resolves.toMatchObject({ state: 'absent' })
  })

  it('normalizes source responses and falls back to source list lookup', async () => {
    const detail = queuedResponses([
      mockJsonResponse({ domain: 'Example.com', counts: { findings: 4 }, findings: ['a', 'b', 'c'] }),
      mockJsonResponse({}, { ok: false, status: 404 }),
    ])
    fetchMock.mockImplementation(
      routingFetchMock((url) =>
        url.startsWith('https://backend.test/api/sources?')
          ? mockJsonResponse([
              { url_domain: 'example.org', display_name: 'Example Org' },
              { url_domain: 'target.com', display_name: 'Target' },
            ])
          : detail(),
      ),
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
    const detail = queuedResponses([
      mockJsonResponse({ findings: [1, 2, 3] }),
      mockJsonResponse({}),
    ])
    fetchMock.mockImplementation(routingFetchMock(() => detail()))

    const api = await importApiWithBackend()
    await expect(api.getFindingsForSource('example.com', { limit: 2 })).resolves.toEqual([1, 2])
    await expect(api.getFindingsForSource('empty.com')).resolves.toEqual([])
  })

  it('falls back from the plural finding endpoint to the singular endpoint', async () => {
    const detail = queuedResponses([
      mockJsonResponse({}, { ok: false, status: 404 }),
      mockJsonResponse({ id: 7 }),
    ])
    fetchMock.mockImplementation(routingFetchMock(() => detail()))

    const api = await importApiWithBackend()
    await expect(api.getFinding(7)).resolves.toEqual({ id: 7 })
  })

  it('gives up on a finding when both endpoints are missing', async () => {
    fetchMock.mockImplementation(
      routingFetchMock(() => mockJsonResponse({}, { ok: false, status: 500 })),
    )
    const api = await importApiWithBackend()

    await expect(api.getFinding(7)).rejects.toBeInstanceOf(Error)
  })

  it('rethrows when the singular finding endpoint is unreachable', async () => {
    const detail = queuedResponses([
      mockJsonResponse({}, { ok: false, status: 404 }),
      mockJsonResponse({}, { ok: false, status: 503 }),
    ])
    fetchMock.mockImplementation(routingFetchMock(() => detail()))
    const api = await importApiWithBackend()

    const err = await api.getFinding(7).catch((e) => e)
    expect(err).toMatchObject({ kind: 'http', status: 503 })
  })

  it('rethrows an unreachable source lookup instead of scanning the whole list', async () => {
    fetchMock.mockImplementation(
      routingFetchMock(() => mockJsonResponse({}, { ok: false, status: 500 })),
    )
    const api = await importApiWithBackend()

    await expect(api.getSourceByDomain('example.com')).rejects.toMatchObject({ kind: 'http' })
    expect(callsMatching(fetchMock, (u) => u.includes('/api/sources?limit=500'))).toHaveLength(0)
  })

  it('caps source findings at 40 when no limit is given', async () => {
    const findings = Array.from({ length: 50 }, (_, i) => i)
    fetchMock.mockImplementation(routingFetchMock(() => mockJsonResponse({ findings })))
    const api = await importApiWithBackend()

    await expect(api.getFindingsForSource('example.com')).resolves.toHaveLength(40)
  })

  it('returns null when no source in the list matches the domain', async () => {
    const detail = queuedResponses([mockJsonResponse({}, { ok: false, status: 404 })])
    fetchMock.mockImplementation(
      routingFetchMock((url) =>
        url.startsWith('https://backend.test/api/sources?')
          ? mockJsonResponse([{ url_domain: 'example.org', display_name: 'Example Org' }])
          : detail(),
      ),
    )
    const api = await importApiWithBackend()

    await expect(api.getSourceByDomain('nobody.com')).resolves.toBeNull()
    await expect(api.getFindingsForSource('nobody.com')).resolves.toEqual([])
  })
})
