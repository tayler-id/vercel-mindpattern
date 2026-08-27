import { NextRequest, NextResponse } from 'next/server'

const BACKEND_URL = process.env.BACKEND_API_URL || 'https://mindpattern.fly.dev'
// Client-side fetches surface their own loading/error states; a wedged
// backend must return an error they can render, not an indefinite hang.
const PROXY_TIMEOUT_MS = 10_000

// First path segments of the backend's public read surface, mirroring
// PUBLIC_PREFIXES in dashboard/auth.py (mindpattern-v3). The proxy fronts
// public reads only; the owner's private endpoints are never reachable
// through the site, whatever the backend's own auth does.
const PUBLIC_GET_SEGMENTS = new Set([
  'audio-briefings',
  'dossiers',
  'entities',
  'feed',
  'finding',
  'findings',
  'health',
  'issues',
  'narrative-arcs',
  'patterns',
  'popular',
  'related',
  'reports',
  'search',
  'site',
  'skill-domains',
  'skills',
  'sources',
  'stats',
  'stories',
  'trending',
])

// The analytics beacon is the only write the site sends.
const PUBLIC_POST_SEGMENTS = new Set(['event'])

// Errors are one stable JSON shape the degraded states already render, and
// no-store so no cache replays a transient failure after the backend recovers.
function errorResponse(error: string, status: number) {
  return NextResponse.json(
    { error },
    { status, headers: { 'Cache-Control': 'no-store' } },
  )
}

function backendTarget(path: string[], allowed: Set<string>): URL | null {
  if (path.length === 0) return null
  // A dot segment would re-point the URL when the segments are joined, so it
  // never reaches the allowlist check.
  for (const segment of path) {
    if (
      !segment ||
      segment === '.' ||
      segment === '..' ||
      segment.includes('/') ||
      segment.includes('\\')
    ) {
      return null
    }
  }
  if (!allowed.has(path[0])) return null
  // The backend contract is "/api/site/..." with a subpath. Bare "/api/site"
  // is off the public surface, and "site-analytics" is its own first segment
  // so it never matches here.
  if (path[0] === 'site' && path.length === 1) return null
  return new URL('/api/' + path.join('/'), BACKEND_URL)
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path } = await params
  const url = backendTarget(path, PUBLIC_GET_SEGMENTS)
  if (url === null) {
    return errorResponse('Not found', 404)
  }

  request.nextUrl.searchParams.forEach((value, key) => {
    url.searchParams.set(key, value)
  })

  let res: Response
  try {
    // A bare fetch: no cookies, no auth, nothing from the reader's request
    // beyond path and query ever reaches the backend.
    res = await fetch(url.toString(), {
      signal: AbortSignal.timeout(PROXY_TIMEOUT_MS),
    })
  } catch {
    return errorResponse('Backend unavailable', 504)
  }
  return jsonPassthrough(res)
}

// The backend answered, so a body that fails to parse is a response problem,
// not a network one. 502 with the real status keeps debugging pointed at the
// backend body; the old blanket 504 read as a dead backend.
async function jsonPassthrough(res: Response) {
  let data: unknown
  try {
    data = await res.json()
  } catch {
    return errorResponse(`Backend returned non-JSON (status ${res.status})`, 502)
  }
  return NextResponse.json(data, { status: res.status })
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path } = await params
  const url = backendTarget(path, PUBLIC_POST_SEGMENTS)
  if (url === null) {
    return errorResponse('Not found', 404)
  }

  // A body that is not JSON gets the same renderable shape, not the
  // framework's HTML 500 page.
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return errorResponse('Invalid JSON body', 400)
  }

  let res: Response
  try {
    res = await fetch(url.toString(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(PROXY_TIMEOUT_MS),
    })
  } catch {
    return errorResponse('Backend unavailable', 504)
  }
  return jsonPassthrough(res)
}
