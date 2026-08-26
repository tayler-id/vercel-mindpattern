import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

type Payload = Record<string, unknown>

const VALID: Payload = {
  name: 'Ada Lovelace',
  email: 'ada@example.com',
  company: 'Analytical Engines',
  stage: 'scoped',
  message: 'We want to automate our intake triage without it going off the rails.',
}

function inquiry(payload: Payload, ip = '203.0.113.7') {
  return new NextRequest('https://site.test/api/inquire', {
    method: 'POST',
    body: JSON.stringify(payload),
    headers: { 'content-type': 'application/json', 'x-forwarded-for': ip },
  })
}

async function importRoute(configured = true) {
  vi.resetModules()
  vi.stubEnv('RESEND_API_KEY', configured ? 'test-key' : '')
  vi.stubEnv('INQUIRY_TO', 'owner@example.com')
  return import('./route')
}

describe('inquire route', () => {
  let fetchMock: ReturnType<typeof vi.fn>

  beforeEach(() => {
    fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) })
    vi.stubGlobal('fetch', fetchMock)
  })

  it('rejects requests when Resend is not configured', async () => {
    const { POST } = await importRoute(false)
    const response = await POST(inquiry(VALID))

    expect(response.status).toBe(503)
    await expect(response.json()).resolves.toEqual({ error: 'Inquiry service not configured' })
  })

  it.each([
    ['a missing name', { ...VALID, name: '' }],
    ['an invalid email', { ...VALID, email: 'not-an-email' }],
    ['a message that says nothing', { ...VALID, message: 'hi' }],
  ])('rejects %s', async (_label, payload) => {
    const { POST } = await importRoute()
    const response = await POST(inquiry(payload))

    expect(response.status).toBe(400)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('swallows honeypot submissions without sending mail', async () => {
    const { POST } = await importRoute()
    const response = await POST(inquiry({ ...VALID, website: 'http://spam.example' }))

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({ ok: true })
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('mails the owner with a reply-to of the sender, then acknowledges them', async () => {
    const { POST } = await importRoute()
    const response = await POST(inquiry(VALID))

    expect(response.status).toBe(200)
    expect(fetchMock).toHaveBeenCalledTimes(2)

    const toOwner = JSON.parse(fetchMock.mock.calls[0][1].body)
    expect(toOwner.to).toEqual(['owner@example.com'])
    expect(toOwner.reply_to).toBe('ada@example.com')
    expect(toOwner.subject).toBe('Consulting inquiry: Ada Lovelace (Analytical Engines)')
    expect(toOwner.text).toContain('Has a specific project in mind')
    expect(toOwner.text).toContain(VALID.message)

    const ack = JSON.parse(fetchMock.mock.calls[1][1].body)
    expect(ack.to).toEqual(['ada@example.com'])
    expect(ack.reply_to).toBe('owner@example.com')
  })

  it('still succeeds when the acknowledgement email fails', async () => {
    fetchMock
      .mockResolvedValueOnce({ ok: true, json: async () => ({}) })
      .mockRejectedValueOnce(new Error('bounced'))
    const { POST } = await importRoute()

    const response = await POST(inquiry(VALID))

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({ ok: true })
  })

  it('reports failure when the owner email cannot be sent', async () => {
    fetchMock.mockResolvedValueOnce({ ok: false, json: async () => ({ message: 'nope' }) })
    const { POST } = await importRoute()

    const response = await POST(inquiry(VALID))

    expect(response.status).toBe(502)
    await expect(response.json()).resolves.toEqual({ error: 'nope' })
  })

  it('rate limits repeat sends from one address', async () => {
    const { POST } = await importRoute()
    const ip = '198.51.100.4'

    for (let i = 0; i < 3; i++) {
      expect((await POST(inquiry(VALID, ip))).status).toBe(200)
    }
    const blocked = await POST(inquiry(VALID, ip))

    expect(blocked.status).toBe(429)
    // A different caller is unaffected.
    expect((await POST(inquiry(VALID, '198.51.100.5'))).status).toBe(200)
  })
})
