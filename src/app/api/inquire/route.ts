import { NextRequest, NextResponse } from 'next/server'

const RESEND_API_KEY = process.env.RESEND_API_KEY
const FROM = 'MindPattern <feedback@tayler.id>'
const TO = process.env.INQUIRY_TO || 'ramsay.tayler@gmail.com'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const STAGE_LABELS: Record<string, string> = {
  exploring: 'Still exploring what AI could do',
  scoped: 'Has a specific project in mind',
  building: 'Already building — needs help making it hold',
}

// Public unauthenticated inbox: cap one IP to a handful of sends per window so
// a bot past the honeypot can't turn Resend into a mail cannon. In-memory is
// per-instance and resets on deploy, which is the right trade here — this is
// nuisance control, not a security boundary.
const WINDOW_MS = 10 * 60_000
const MAX_PER_WINDOW = 3
const hits = new Map<string, number[]>()

function rateLimited(ip: string, now: number): boolean {
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS)
  if (recent.length >= MAX_PER_WINDOW) {
    hits.set(ip, recent)
    return true
  }
  recent.push(now)
  hits.set(ip, recent)
  if (hits.size > 5000) hits.clear()
  return false
}

function str(value: unknown, max: number): string {
  return typeof value === 'string' ? value.trim().slice(0, max) : ''
}

export async function POST(request: NextRequest) {
  if (!RESEND_API_KEY) {
    return NextResponse.json({ error: 'Inquiry service not configured' }, { status: 503 })
  }

  const body = await request.json().catch(() => null)
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  // Honeypot: bots fill every field they find. Answer 200 so they don't retry.
  if (str((body as Record<string, unknown>).website, 200)) {
    return NextResponse.json({ ok: true })
  }

  const fields = body as Record<string, unknown>
  const name = str(fields.name, 120)
  const email = str(fields.email, 200)
  const company = str(fields.company, 120)
  const stage = str(fields.stage, 40)
  const message = str(fields.message, 4000)

  if (!name || !EMAIL_RE.test(email) || message.length < 10) {
    return NextResponse.json(
      { error: 'Name, a valid email, and a few words about the project are required.' },
      { status: 400 },
    )
  }

  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
  if (rateLimited(ip, Date.now())) {
    return NextResponse.json(
      { error: "That's a few in a row — give it ten minutes." },
      { status: 429 },
    )
  }

  const lines = [
    `From:    ${name} <${email}>`,
    company ? `Company: ${company}` : null,
    `Stage:   ${STAGE_LABELS[stage] || stage || 'not stated'}`,
    '',
    message,
  ].filter((line): line is string => line !== null)

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: FROM,
      to: [TO],
      reply_to: email,
      subject: `Consulting inquiry: ${name}${company ? ` (${company})` : ''}`,
      text: lines.join('\n'),
    }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    return NextResponse.json(
      { error: err.message || 'Failed to send. Try again.' },
      { status: 502 },
    )
  }

  // Acknowledgement to the sender — fire-and-forget so a bounce, an
  // unverified domain, or a typo'd address never fails a real inquiry.
  fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: FROM,
      to: [email],
      reply_to: TO,
      subject: 'Got it — Tayler Ramsay',
      text: `${name},\n\nYour note reached me. I read these myself and I'll come back to you within two working days.\n\nIn the meantime, the wire at https://mindpattern.ai is the system I described — it publishes itself every night.\n\n— Tayler`,
    }),
  }).catch(() => {})

  return NextResponse.json({ ok: true })
}
