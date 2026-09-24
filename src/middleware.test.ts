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
      requestFor('Mozilla/5.0 ChatGPT-User extra text', '/s/story-one') as never,
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
        target: 'chatgpt-user',
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

  it.each([
    ['Mozilla/5.0 GPTBot/1.2', 'gptbot'],
    ['ClaudeBot/1.0', 'claudebot'],
    ['CCBot/2.0', 'ccbot'],
    ['meta-externalagent/1.1', 'meta'],
    ['Bytespider', 'bytespider'],
    ['Amazonbot/0.1', 'amazonbot'],
  ])('refuses the training crawler %s and still records the hit', async (userAgent, family) => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 204 }))
    vi.stubGlobal('fetch', fetchMock)
    const waitUntil = vi.fn()
    const { middleware } = await import('./middleware')

    const response = middleware(requestFor(userAgent, '/e/langchain') as never, { waitUntil } as never)

    expect(response.status).toBe(403)
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({
      type: 'agent_hit',
      target: family,
      path: '/e/langchain',
    })
  })

  it('lets a blocked training crawler read robots.txt', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status: 204 })))
    const { middleware } = await import('./middleware')

    const response = middleware(requestFor('GPTBot', '/robots.txt') as never, { waitUntil: vi.fn() } as never)

    expect(response.status).toBe(200)
  })

  it.each(['ChatGPT-User/1.0', 'OAI-SearchBot/1.0', 'Claude-User', 'PerplexityBot', 'DuckAssistBot', 'Googlebot/2.1', 'Applebot/0.1'])(
    'serves the answer or search agent %s',
    async (userAgent) => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status: 204 })))
      const { middleware } = await import('./middleware')

      const response = middleware(requestFor(userAgent) as never, { waitUntil: vi.fn() } as never)

      expect(response.status).toBe(200)
    },
  )
})
