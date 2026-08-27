import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'

/**
 * Purge-on-publish. The pipeline (orchestrator/sync.py in mindpattern-v3)
 * POSTs the paths a publish or a deploy changed, and each one drops out of the
 * ISR cache immediately instead of waiting out its hour-long TTL.
 *
 * Auth is a shared secret in the x-revalidate-secret header. The secret is
 * never returned or logged. The comparison is not constant time across
 * lengths: a length mismatch is rejected outright, which leaks the secret's
 * length. Equal-length secrets are compared character by character with no
 * early exit. There is no rate limit either, so nothing slows a brute force
 * against the 401. Both are acceptable because the secret is a long random
 * value and the allowlist below bounds what a correct guess could do.
 */

// One publish sends up to 200 paths (REVALIDATE_MAX_PATHS in
// orchestrator/sync.py), split into batches of 50 by the caller, so this cap
// bounds a single POST, not the publish.
const MAX_PATHS = 60

// Only this site's own reader routes. Anything else is rejected rather than
// handed to revalidatePath, so a leaked secret still cannot reach into
// Next.js internals or purge a route that does not exist.
const ALLOWED_PATHS: RegExp[] = [
  /^\/$/,
  /^\/(?:blog|briefings|explore|search|work)$/,
  /^\/briefings\/\d{4}-\d{2}-\d{2}$/,
  /^\/blog\/\d{4}-\d{2}-\d{2}$/,
  /^\/s\/[a-z0-9][a-z0-9-]{0,159}$/,
  /^\/e\/[a-z0-9][a-z0-9-]{0,79}$/,
  /^\/f\/[A-Za-z0-9_-]{1,80}$/,
  /^\/arc\/[A-Za-z0-9_-]{1,80}$/,
  /^\/source\/[a-z0-9][a-z0-9.-]{0,79}$/,
]

function isAllowedPath(path: unknown): path is string {
  return typeof path === 'string' && ALLOWED_PATHS.some((pattern) => pattern.test(path))
}

/**
 * Rejects a length mismatch outright, then compares every character of an
 * equal-length secret with no early exit. See the header note on what this
 * does and does not hide.
 */
function secretMatches(given: string, expected: string): boolean {
  if (given.length !== expected.length) return false
  let diff = 0
  for (let i = 0; i < given.length; i += 1) {
    diff |= given.charCodeAt(i) ^ expected.charCodeAt(i)
  }
  return diff === 0
}

export async function POST(request: NextRequest) {
  const expected = process.env.REVALIDATE_SECRET ?? ''
  if (!expected) {
    return NextResponse.json({ error: 'Revalidation not configured' }, { status: 503 })
  }

  const given = request.headers.get('x-revalidate-secret') ?? ''
  if (!given || !secretMatches(given, expected)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json().catch(() => null)
  const paths = (body as { paths?: unknown } | null)?.paths
  if (!Array.isArray(paths) || paths.length === 0) {
    return NextResponse.json({ error: 'paths must be a non-empty array' }, { status: 400 })
  }
  if (paths.length > MAX_PATHS) {
    return NextResponse.json(
      { error: `too many paths (max ${MAX_PATHS})` },
      { status: 400 },
    )
  }

  const revalidated: string[] = []
  const rejected: string[] = []
  for (const path of paths) {
    if (!isAllowedPath(path)) {
      rejected.push(typeof path === 'string' ? path.slice(0, 120) : String(path).slice(0, 120))
      continue
    }
    if (revalidated.includes(path)) continue
    revalidatePath(path)
    revalidated.push(path)
  }

  return NextResponse.json({ ok: rejected.length === 0, revalidated, rejected })
}
