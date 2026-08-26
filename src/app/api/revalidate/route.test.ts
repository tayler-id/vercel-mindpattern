import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const revalidatePath = vi.fn()

vi.mock('next/cache', () => ({
  revalidatePath: (path: string) => revalidatePath(path),
}))

const SECRET = 'test-secret-value'

function request(body: unknown, secret?: string) {
  const headers: Record<string, string> = { 'content-type': 'application/json' }
  if (secret !== undefined) headers['x-revalidate-secret'] = secret
  return new NextRequest('https://site.test/api/revalidate', {
    method: 'POST',
    body: typeof body === 'string' ? body : JSON.stringify(body),
    headers,
  })
}

describe('revalidate route', () => {
  beforeEach(() => {
    revalidatePath.mockClear()
    vi.stubEnv('REVALIDATE_SECRET', SECRET)
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('refuses to run when no secret is configured on the server', async () => {
    vi.stubEnv('REVALIDATE_SECRET', '')
    const { POST } = await import('./route')

    const response = await POST(request({ paths: ['/'] }, SECRET))

    expect(response.status).toBe(503)
    await expect(response.json()).resolves.toEqual({ error: 'Revalidation not configured' })
    expect(revalidatePath).not.toHaveBeenCalled()
  })

  it('rejects a request with no secret header', async () => {
    const { POST } = await import('./route')

    const response = await POST(request({ paths: ['/'] }))

    expect(response.status).toBe(401)
    await expect(response.json()).resolves.toEqual({ error: 'Unauthorized' })
    expect(revalidatePath).not.toHaveBeenCalled()
  })

  it('rejects a wrong secret of the same length', async () => {
    const { POST } = await import('./route')

    const response = await POST(request({ paths: ['/'] }, 'test-secret-valuX'.slice(0, SECRET.length)))

    expect(response.status).toBe(401)
    expect(revalidatePath).not.toHaveBeenCalled()
  })

  it('rejects a wrong secret of a different length', async () => {
    const { POST } = await import('./route')

    const response = await POST(request({ paths: ['/'] }, 'short'))

    expect(response.status).toBe(401)
    expect(revalidatePath).not.toHaveBeenCalled()
  })

  it('never echoes the secret back', async () => {
    const { POST } = await import('./route')

    const response = await POST(request({ paths: ['/'] }, SECRET))
    const text = JSON.stringify(await response.json())

    expect(text).not.toContain(SECRET)
    expect(response.headers.get('x-revalidate-secret')).toBeNull()
  })

  it('rejects a body that is not JSON', async () => {
    const { POST } = await import('./route')

    const response = await POST(request('not json at all', SECRET))

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({
      error: 'paths must be a non-empty array',
    })
  })

  it('rejects an empty or non-array paths field', async () => {
    const { POST } = await import('./route')

    expect((await POST(request({ paths: [] }, SECRET))).status).toBe(400)
    expect((await POST(request({ paths: '/s/one' }, SECRET))).status).toBe(400)
    expect((await POST(request({}, SECRET))).status).toBe(400)
    expect(revalidatePath).not.toHaveBeenCalled()
  })

  it('caps the number of paths per call', async () => {
    const { POST } = await import('./route')
    const paths = Array.from({ length: 61 }, (_, i) => `/s/story-${i}`)

    const response = await POST(request({ paths }, SECRET))

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({ error: 'too many paths (max 60)' })
    expect(revalidatePath).not.toHaveBeenCalled()
  })

  it('revalidates every allowed reader route', async () => {
    const { POST } = await import('./route')
    const paths = [
      '/',
      '/briefings',
      '/explore',
      '/search',
      '/work',
      '/briefings/2026-08-25',
      '/blog/2026-08-25',
      '/s/2026-08-25-a-story-slug',
      // Real published slugs run long; the pipeline sends them verbatim.
      '/s/2026-08-25-a-22gb-4-bit-tielcoder-35b-a3b-quant-is-being-benchmarked-at-opus-4-6-medium-parity-o',
      '/e/artificial-analysis-intelligence-index',
      '/f/abc123_ID-9',
      '/arc/arc_42',
      '/source/simonwillison.net',
    ]

    const response = await POST(request({ paths }, SECRET))

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({ ok: true, revalidated: paths, rejected: [] })
    expect(revalidatePath).toHaveBeenCalledTimes(paths.length)
    expect(revalidatePath).toHaveBeenCalledWith('/e/artificial-analysis-intelligence-index')
  })

  it('rejects paths outside this site without touching the cache', async () => {
    const { POST } = await import('./route')
    const paths = [
      '/s/good-slug',
      '/api/proxy/anything',
      '../../etc/passwd',
      'https://evil.test/s/x',
      '/s/../../secret',
      '/layout',
      '/briefings/not-a-date',
      42,
      null,
    ]

    const response = await POST(request({ paths }, SECRET))
    const body = (await response.json()) as {
      ok: boolean
      revalidated: string[]
      rejected: string[]
    }

    expect(response.status).toBe(200)
    expect(body.ok).toBe(false)
    expect(body.revalidated).toEqual(['/s/good-slug'])
    expect(body.rejected).toHaveLength(8)
    expect(revalidatePath).toHaveBeenCalledTimes(1)
    expect(revalidatePath).toHaveBeenCalledWith('/s/good-slug')
  })

  it('truncates long rejected paths in the response', async () => {
    const { POST } = await import('./route')
    const long = `/s/${'x'.repeat(400)} `

    const body = (await (await POST(request({ paths: [long] }, SECRET))).json()) as {
      rejected: string[]
    }

    expect(body.rejected[0]).toHaveLength(120)
  })

  it('revalidates a repeated path only once', async () => {
    const { POST } = await import('./route')

    const response = await POST(request({ paths: ['/s/dup', '/s/dup', '/'] }, SECRET))

    await expect(response.json()).resolves.toEqual({
      ok: true,
      revalidated: ['/s/dup', '/'],
      rejected: [],
    })
    expect(revalidatePath).toHaveBeenCalledTimes(2)
  })
})
