import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

function requestWithEmail(email: unknown) {
  return new NextRequest('https://site.test/api/unsubscribe', {
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

describe('unsubscribe route', () => {
  let fetchMock: ReturnType<typeof vi.fn>

  beforeEach(() => {
    fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
  })

  it('rejects requests when Resend is not configured', async () => {
    const { POST } = await importRoute(false)
    const response = await POST(requestWithEmail('reader@example.com'))

    expect(response.status).toBe(503)
    await expect(response.json()).resolves.toEqual({ error: 'Service not configured' })
  })

  it('validates email input', async () => {
    const { POST } = await importRoute()
    const response = await POST(requestWithEmail('bad-email'))

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({ error: 'Valid email required' })
  })

  it('returns a generic success if the contact is not found', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: vi.fn().mockResolvedValue({ data: [{ id: 'other', email: 'other@example.com' }] }),
    })
    const { POST } = await importRoute()

    const response = await POST(requestWithEmail('reader@example.com'))

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({ ok: true })
  })

  it('deletes a matching contact case-insensitively', async () => {
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue({ data: [{ id: 'contact-id', email: 'Reader@Example.com' }] }),
      })
      .mockResolvedValueOnce({ ok: true })
    const { POST } = await importRoute()

    const response = await POST(requestWithEmail('reader@example.com'))

    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      'https://api.resend.com/audiences/audience-id/contacts?email=reader%40example.com',
      { headers: { Authorization: 'Bearer test-key' } },
    )
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      'https://api.resend.com/audiences/audience-id/contacts/contact-id',
      { method: 'DELETE', headers: { Authorization: 'Bearer test-key' } },
    )
    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({ ok: true })
  })

  it('returns a lookup error if contact listing fails', async () => {
    fetchMock.mockResolvedValueOnce({ ok: false })
    const { POST } = await importRoute()

    const response = await POST(requestWithEmail('reader@example.com'))

    expect(response.status).toBe(500)
    await expect(response.json()).resolves.toEqual({ error: 'Failed to look up contact' })
  })

  it('returns an unsubscribe error if deletion fails', async () => {
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue({ data: [{ id: 'contact-id', email: 'reader@example.com' }] }),
      })
      .mockResolvedValueOnce({ ok: false })
    const { POST } = await importRoute()

    const response = await POST(requestWithEmail('reader@example.com'))

    expect(response.status).toBe(500)
    await expect(response.json()).resolves.toEqual({ error: 'Failed to unsubscribe' })
  })
})
