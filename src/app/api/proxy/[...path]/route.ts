import { NextRequest, NextResponse } from 'next/server'

const BACKEND_URL = process.env.BACKEND_API_URL || 'https://mindpattern.fly.dev'
// Client-side fetches surface their own loading/error states; a wedged
// backend must return an error they can render, not an indefinite hang.
const PROXY_TIMEOUT_MS = 10_000

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path } = await params
  const apiPath = '/api/' + path.join('/')
  const url = new URL(apiPath, BACKEND_URL)

  request.nextUrl.searchParams.forEach((value, key) => {
    url.searchParams.set(key, value)
  })

  try {
    const res = await fetch(url.toString(), {
      signal: AbortSignal.timeout(PROXY_TIMEOUT_MS),
    })
    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  } catch {
    return NextResponse.json({ error: 'Backend unavailable' }, { status: 504 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path } = await params
  const apiPath = '/api/' + path.join('/')
  const url = new URL(apiPath, BACKEND_URL)
  const body = await request.json()

  try {
    const res = await fetch(url.toString(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(PROXY_TIMEOUT_MS),
    })
    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  } catch {
    return NextResponse.json({ error: 'Backend unavailable' }, { status: 504 })
  }
}
