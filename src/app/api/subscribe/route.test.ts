import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

function requestWithEmail(email: unknown) {
  return new NextRequest('https://site.test/api/subscribe', {
    method: 'POST',
    body: JSON.stringify({ email }),
    headers: { 'content-type': 'application/json' },
  })
}

async function importRoute(configured = true) {
  vi.resetModules()
  if (configured) {
    vi.stubEnv('RESEND_API_KEY', 'test-key')
    vi.stubEnv('RESEND_AUDIENCE_ID', 'audience-id')
  } else {
    vi.stubEnv('RESEND_API_KEY', '')
    vi.stubEnv('RESEND_AUDIENCE_ID', '')
  }
  return import('./route')
}

describe('subscribe route', () => {
  let fetchMock: ReturnType<typeof vi.fn>

  beforeEach(() => {
    fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
  })

  it('rejects requests when Resend is not configured', async () => {
    const { POST } = await importRoute(false)
    const response = await POST(requestWithEmail('reader@example.com'))

    expect(response.status).toBe(503)
    await expect(response.json()).resolves.toEqual({ error: 'Newsletter service not configured' })
  })

  it('validates email input', async () => {
    const { POST } = await importRoute()
    const response = await POST(requestWithEmail('bad-email'))

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({ error: 'Valid email required' })
  })

  it('subscribes a new reader and sends a notification', async () => {
    fetchMock.mockResolvedValueOnce({ ok: true }).mockResolvedValueOnce({ ok: true })
    const { POST } = await importRoute()

    const response = await POST(requestWithEmail('reader@example.com'))

    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      'https://api.resend.com/audiences/audience-id/contacts',
      expect.objectContaining({
        method: 'POST',
        headers: {
          Authorization: 'Bearer test-key',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: 'reader@example.com', unsubscribed: false }),
      }),
    )
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      'https://api.resend.com/emails',
      expect.objectContaining({ method: 'POST' }),
    )
    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({ ok: true })
  })

  it('treats existing contacts as successful subscriptions', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 409,
      json: vi.fn().mockResolvedValue({ message: 'Exists' }),
    })
    const { POST } = await importRoute()

    const response = await POST(requestWithEmail('reader@example.com'))

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({ ok: true, already: true })
  })

  it('returns Resend error messages for failed subscriptions', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 422,
      json: vi.fn().mockResolvedValue({ message: 'Invalid domain' }),
    })
    const { POST } = await importRoute()

    const response = await POST(requestWithEmail('reader@example.com'))

    expect(response.status).toBe(422)
    await expect(response.json()).resolves.toEqual({ error: 'Invalid domain' })
  })

  it('uses a generic message when Resend error bodies are not JSON', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: vi.fn().mockRejectedValue(new Error('not json')),
    })
    const { POST } = await importRoute()

    const response = await POST(requestWithEmail('reader@example.com'))

    expect(response.status).toBe(500)
    await expect(response.json()).resolves.toEqual({ error: 'Failed to subscribe' })
  })

  it('ignores notification delivery failures', async () => {
    fetchMock
      .mockResolvedValueOnce({ ok: true })
      .mockReturnValueOnce(Promise.reject(new Error('notify failed')))
    const { POST } = await importRoute()

    const response = await POST(requestWithEmail('reader@example.com'))

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({ ok: true })
  })
})
