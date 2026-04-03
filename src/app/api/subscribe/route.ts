import { NextRequest, NextResponse } from 'next/server'

const RESEND_API_KEY = process.env.RESEND_API_KEY
const RESEND_AUDIENCE_ID = process.env.RESEND_AUDIENCE_ID

export async function POST(request: NextRequest) {
  if (!RESEND_API_KEY || !RESEND_AUDIENCE_ID) {
    return NextResponse.json(
      { error: 'Newsletter service not configured' },
      { status: 503 },
    )
  }

  const { email } = await request.json()

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'Valid email required' }, { status: 400 })
  }

  const res = await fetch(
    `https://api.resend.com/audiences/${RESEND_AUDIENCE_ID}/contacts`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, unsubscribed: false }),
    },
  )

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    // Resend returns 409 if contact already exists — treat as success
    if (res.status === 409) {
      return NextResponse.json({ ok: true, already: true })
    }
    return NextResponse.json(
      { error: body.message || 'Failed to subscribe' },
      { status: res.status },
    )
  }

  return NextResponse.json({ ok: true })
}
