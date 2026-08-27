import { beforeEach, describe, expect, it, vi } from 'vitest'
import { GET, POST } from './route'

function mockJsonResponse(data: unknown, status = 200) {
  return {
    status,
    json: vi.fn().mockResolvedValue(data),
  }
}

describe('proxy route', () => {
  let fetchMock: ReturnType<typeof vi.fn>

  beforeEach(() => {
    fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
  })

  it('proxies GET requests with path segments and query params', async () => {
    fetchMock.mockResolvedValue(mockJsonResponse({ items: [1] }, 202))
    const request = {
      nextUrl: new URL('https://site.test/api/proxy/stories/latest?user=ramsay&limit=5'),
    }

    const response = await GET(request as never, {
      params: Promise.resolve({ path: ['stories', 'latest'] }),
    })

    // A wedged backend must fail fast rather than hang the client fetch.
    expect(fetchMock).toHaveBeenCalledWith(
      'https://mindpattern.fly.dev/api/stories/latest?user=ramsay&limit=5',
      { signal: expect.any(AbortSignal) },
    )
    expect(response.status).toBe(202)
    await expect(response.json()).resolves.toEqual({ items: [1] })
  })

  it('proxies POST requests with JSON bodies', async () => {
    fetchMock.mockResolvedValue(mockJsonResponse({ ok: true }, 201))
    const request = {
      json: vi.fn().mockResolvedValue({ type: 'event' }),
    }

    const response = await POST(request as never, {
      params: Promise.resolve({ path: ['event'] }),
    })

    expect(fetchMock).toHaveBeenCalledWith('https://mindpattern.fly.dev/api/event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'event' }),
      signal: expect.any(AbortSignal),
    })
    expect(response.status).toBe(201)
    await expect(response.json()).resolves.toEqual({ ok: true })
  })

  it('answers 504 rather than hanging when the backend never replies', async () => {
    fetchMock.mockRejectedValue(new DOMException('aborted', 'TimeoutError'))
    const request = { nextUrl: new URL('https://site.test/api/proxy/stats') }

    const response = await GET(request as never, {
      params: Promise.resolve({ path: ['stats'] }),
    })

    expect(response.status).toBe(504)
    await expect(response.json()).resolves.toEqual({ error: 'Backend unavailable' })
    // A transient failure must never be replayed from a cache after the
    // backend recovers.
    expect(response.headers.get('Cache-Control')).toBe('no-store')
  })

  it('answers 502 with the backend status when the backend replies non-JSON', async () => {
    // An HTML error page or an empty 500 is the backend answering, not the
    // backend gone. Reporting it as 504 pointed debugging at the network for
    // what is a response-body problem.
    fetchMock.mockResolvedValue({
      status: 500,
      json: vi.fn().mockRejectedValue(new SyntaxError('Unexpected token <')),
    })
    const request = { nextUrl: new URL('https://site.test/api/proxy/stats') }

    const response = await GET(request as never, {
      params: Promise.resolve({ path: ['stats'] }),
    })

    expect(response.status).toBe(502)
    await expect(response.json()).resolves.toEqual({
      error: 'Backend returned non-JSON (status 500)',
    })
    expect(response.headers.get('Cache-Control')).toBe('no-store')
  })

  it('answers 502 for a non-JSON reply to the beacon POST too', async () => {
    fetchMock.mockResolvedValue({
      status: 503,
      json: vi.fn().mockRejectedValue(new SyntaxError('empty body')),
    })
    const request = { json: vi.fn().mockResolvedValue({ type: 'event' }) }

    const response = await POST(request as never, {
      params: Promise.resolve({ path: ['event'] }),
    })

    expect(response.status).toBe(502)
    await expect(response.json()).resolves.toEqual({
      error: 'Backend returned non-JSON (status 503)',
    })
  })

  it('refuses paths off the public read surface without touching the backend', async () => {
    // site-analytics, prompts and traces are the owner's private surface.
    for (const path of [['site-analytics'], ['prompts'], ['traces', 'runs'], ['site']]) {
      const request = { nextUrl: new URL('https://site.test/api/proxy/x') }

      const response = await GET(request as never, {
        params: Promise.resolve({ path }),
      })

      expect(response.status).toBe(404)
      await expect(response.json()).resolves.toEqual({ error: 'Not found' })
      expect(response.headers.get('Cache-Control')).toBe('no-store')
    }
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('refuses dot segments that would re-point the joined URL', async () => {
    const request = { nextUrl: new URL('https://site.test/api/proxy/x') }

    const response = await GET(request as never, {
      params: Promise.resolve({ path: ['stories', '..', 'admin'] }),
    })

    expect(response.status).toBe(404)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('lets POST through only for the analytics beacon', async () => {
    const request = { json: vi.fn().mockResolvedValue({}) }

    const response = await POST(request as never, {
      params: Promise.resolve({ path: ['stories'] }),
    })

    expect(response.status).toBe(404)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('answers a malformed POST body with the JSON error shape, not an HTML 500', async () => {
    const request = { json: vi.fn().mockRejectedValue(new SyntaxError('bad json')) }

    const response = await POST(request as never, {
      params: Promise.resolve({ path: ['event'] }),
    })

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({ error: 'Invalid JSON body' })
    expect(fetchMock).not.toHaveBeenCalled()
  })
})
