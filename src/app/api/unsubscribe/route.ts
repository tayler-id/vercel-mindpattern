import { NextRequest, NextResponse } from 'next/server'

const RESEND_API_KEY = process.env.RESEND_API_KEY
const RESEND_AUDIENCE_ID = process.env.RESEND_AUDIENCE_ID

export async function POST(request: NextRequest) {
  if (!RESEND_API_KEY || !RESEND_AUDIENCE_ID) {
    return NextResponse.json(
      { error: 'Service not configured' },
      { status: 503 },
    )
  }

  const { email } = await request.json()

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'Valid email required' }, { status: 400 })
  }

  // Find the contact by email
  const listRes = await fetch(
    `https://api.resend.com/audiences/${RESEND_AUDIENCE_ID}/contacts?email=${encodeURIComponent(email)}`,
    {
      headers: { Authorization: `Bearer ${RESEND_API_KEY}` },
    },
  )

  if (!listRes.ok) {
    return NextResponse.json({ error: 'Failed to look up contact' }, { status: 500 })
  }

  const listData = await listRes.json()
  const contact = listData.data?.find(
    (c: { email: string }) => c.email.toLowerCase() === email.toLowerCase(),
  )

  if (!contact) {
    // Don't reveal whether the email exists
    return NextResponse.json({ ok: true })
  }

  // Remove the contact from the audience
  const delRes = await fetch(
    `https://api.resend.com/audiences/${RESEND_AUDIENCE_ID}/contacts/${contact.id}`,
    {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${RESEND_API_KEY}` },
    },
  )

  if (!delRes.ok) {
    return NextResponse.json({ error: 'Failed to unsubscribe' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
