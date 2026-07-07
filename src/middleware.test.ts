import { beforeEach, describe, expect, it, vi } from 'vitest'

function requestFor(userAgent: string, pathname = '/story') {
  return {
    headers: {
      get: (name: string) => (name.toLowerCase() === 'user-agent' ? userAgent : null),
    },
    nextUrl: { pathname },
  }
}

describe('middleware', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  it('records recognized AI crawler hits without storing the raw user agent', async () => {
    vi.stubEnv('BACKEND_API_URL', 'https://backend.test')
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 204 }))
    vi.stubGlobal('fetch', fetchMock)
    const waitUntil = vi.fn()
    const { middleware, config } = await import('./middleware')

    const response = middleware(
      requestFor('Mozilla/5.0 GPTBot extra text', '/s/story-one') as never,
      { waitUntil } as never,
    )

    expect(config.matcher).toEqual(['/((?!_next/|api/|favicon|.*\\.(?:png|jpg|svg|ico|css|js)$).*)'])
    expect(response.status).toBe(200)
    expect(waitUntil).toHaveBeenCalledTimes(1)
    expect(fetchMock).toHaveBeenCalledWith('https://backend.test/api/event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'agent_hit',
        target: 'gptbot',
        path: '/s/story-one',
      }),
    })
  })

  it('does not record ordinary browser traffic', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    const waitUntil = vi.fn()
    const { middleware } = await import('./middleware')

    middleware(requestFor('Mozilla/5.0 Safari') as never, { waitUntil } as never)

    expect(waitUntil).not.toHaveBeenCalled()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('handles requests without a user-agent header', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    const waitUntil = vi.fn()
    const { middleware } = await import('./middleware')

    middleware(
      {
        headers: { get: () => null },
        nextUrl: { pathname: '/no-agent' },
      } as never,
      { waitUntil } as never,
    )

    expect(waitUntil).not.toHaveBeenCalled()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('records only the first matched crawler family', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 204 }))
    vi.stubGlobal('fetch', fetchMock)
    const waitUntil = vi.fn()
    const { middleware } = await import('./middleware')

    middleware(requestFor('ClaudeBot Googlebot') as never, { waitUntil } as never)

    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toMatchObject({
      target: 'claudebot',
    })
  })

  it('swallows failed crawler hit beacons', async () => {
    const waitUntilPromises: Promise<unknown>[] = []
    const fetchMock = vi.fn().mockRejectedValue(new Error('offline'))
    vi.stubGlobal('fetch', fetchMock)
    const waitUntil = vi.fn((promise: Promise<unknown>) => {
      waitUntilPromises.push(promise)
    })
    const { middleware } = await import('./middleware')

    middleware(requestFor('PerplexityBot') as never, { waitUntil } as never)

    expect(waitUntilPromises).toHaveLength(1)
    await expect(waitUntilPromises[0]).resolves.toBeUndefined()
  })
})
