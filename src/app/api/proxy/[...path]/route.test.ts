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
  })
})
