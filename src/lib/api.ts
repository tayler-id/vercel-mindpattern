import type {
  AudioBriefing,
  FeedResponse,
  Finding,
  PublicEntity,
  PublicIssue,
  PublicStory,
  NarrativeArc,
  RelatedResponse,
  Report,
  ReportListItem,
  Source,
  Stats,
  StoriesResponse,
} from './types'

const BACKEND_URL = process.env.BACKEND_API_URL || 'https://mindpattern.fly.dev'

// A slow backend must fail fast, never hang a render: without this signal a
// wedged Fly box held server renders open until the Vercel function timed out,
// which read as "links don't work."
const BACKEND_TIMEOUT_MS = Number(process.env.BACKEND_FETCH_TIMEOUT_MS ?? 10_000)

// Why a failure happened, not just that it did. Callers have to tell "this
// slug does not exist" (safe to answer with notFound(), and cacheable) from
// "the box did not answer" (must not be cached, and should render a degraded
// page that still carries its own og: tags) without matching on message text.
export type BackendErrorKind =
  // The backend answered 404.
  | 'not_found'
  // The backend answered, with some other non-OK status.
  | 'http'
  // No answer inside BACKEND_TIMEOUT_MS.
  | 'timeout'
  // Socket, DNS, or a body that ended mid-flight.
  | 'network'

function backendErrorMessage(status: number, path: string, kind: BackendErrorKind): string {
  if (kind === 'timeout') return `Backend timed out after ${BACKEND_TIMEOUT_MS}ms: ${path}`
  if (kind === 'network') return `Backend unreachable: ${path}`
  return `Backend ${status}: ${path}`
}

// Detail pages are ISR-cached, so error semantics matter: only a backend 404
// may become a notFound() (cacheable), while timeouts/5xx must throw so the
// error boundary renders and the bad response is never cached as real content.
export class BackendError extends Error {
  readonly status: number
  readonly path: string
  readonly kind: BackendErrorKind

  constructor(
    status: number,
    path: string,
    kind: BackendErrorKind = status === 404 ? 'not_found' : 'http',
    options?: { cause?: unknown },
  ) {
    super(backendErrorMessage(status, path, kind), options)
    this.name = 'BackendError'
    this.status = status
    this.path = path
    this.kind = kind
  }

  // status 0: no HTTP response ever arrived.
  static timeout(path: string, cause?: unknown): BackendError {
    return new BackendError(0, path, 'timeout', { cause })
  }

  static network(path: string, cause?: unknown): BackendError {
    return new BackendError(0, path, 'network', { cause })
  }
}

function asBackendError(path: string, err: unknown): BackendError {
  if (err instanceof BackendError) return err
  const name = (err as { name?: string } | null | undefined)?.name
  // AbortSignal.timeout() rejects with a TimeoutError; an outer abort (the
  // request going away mid-render) rejects with an AbortError. Neither means
  // the content is missing.
  if (name === 'TimeoutError' || name === 'AbortError') return BackendError.timeout(path, err)
  return BackendError.network(path, err)
}

export function isBackendNotFound(err: unknown): boolean {
  return err instanceof BackendError && err.kind === 'not_found'
}

/**
 * True when the backend gave no usable answer, whatever shape that took.
 *
 * This is the one every render path branches on. It covers `http` as well as
 * `timeout` and `network`, because Fly's proxy failing to place a request
 * ("could not find a good candidate within 40 attempts at load balancing")
 * arrives as a 502 or 503, not as a dead socket. Excluding those was how a
 * degraded morning still turned a story page into a bare 500 with no og: tags.
 * Only `not_found` is excluded, and that is the one kind a caller may cache.
 */
export function isBackendUnreachable(err: unknown): boolean {
  return err instanceof BackendError && err.kind !== 'not_found'
}

export async function backendFetch<T>(
  path: string,
  params?: Record<string, string>,
  opts?: { revalidate?: number },
): Promise<T> {
  const url = new URL(path, BACKEND_URL)
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v) url.searchParams.set(k, v)
    })
  }
  let res: Response
  try {
    res = await fetch(url.toString(), {
      next: { revalidate: opts?.revalidate ?? 300 },
      signal: AbortSignal.timeout(BACKEND_TIMEOUT_MS),
    })
  } catch (err) {
    throw asBackendError(path, err)
  }
  if (!res.ok) {
    // Release the socket back to the pool. During a 5xx storm the unread
    // bodies are what keep undici's connections pinned until GC runs.
    res.body?.cancel().catch(() => {})
    throw new BackendError(res.status, path)
  }
  try {
    return (await res.json()) as T
  } catch (err) {
    // A wedged box can send headers and then drop the socket. That is a
    // transport failure, not a real 200 with no content.
    throw new BackendError(res.status, path, 'network', { cause: err })
  }
}

export type BackendOutcome<T> =
  | { status: 'ok'; data: T }
  | { status: 'missing' }
  | { status: 'unavailable'; error: BackendError }

/** Next signals notFound() and redirect() by throwing an Error with a digest. */
function isControlFlowError(err: unknown): boolean {
  return typeof (err as { digest?: unknown } | null | undefined)?.digest === 'string'
}

/**
 * No-throw wrapper for render paths that must produce a page either way.
 *
 * `missing` means the record genuinely is not there, so the caller may answer
 * notFound() and let that be cached. `unavailable` means the box did not
 * answer, so the caller must render a degraded page and keep it out of the
 * cache. It carries the typed error for logging.
 *
 * Only failures that came out of `backendFetch` are classified. A notFound()
 * or redirect() thrown inside `load`, and any ordinary bug, is rethrown: this
 * wrapper is for backend failures, and relabelling a TypeError as "the backend
 * is down" hides the defect and shows readers the wrong page.
 *
 * Safe over any helper that rethrows non-404 failures, which is all of them.
 */
export async function backendOutcome<T>(load: () => Promise<T | null>): Promise<BackendOutcome<T>> {
  try {
    const data = await load()
    return data == null ? { status: 'missing' } : { status: 'ok', data }
  } catch (err) {
    if (isBackendNotFound(err)) return { status: 'missing' }
    if (err instanceof BackendError) return { status: 'unavailable', error: err }
    if (isControlFlowError(err)) throw err
    const name = (err as { name?: string } | null | undefined)?.name
    if (name !== 'TimeoutError' && name !== 'AbortError' && name !== 'TypeError') throw err
    return { status: 'unavailable', error: asBackendError('(unknown)', err) }
  }
}

export function backendAssetUrl(path: string): string {
  return new URL(path, BACKEND_URL).toString()
}

// ── Typed helpers over the live backend (reused by Server Components) ──────────

export function getStats() {
  return backendFetch<Stats>('/api/stats')
}

export function getFindings(opts: {
  limit?: number
  offset?: number
  agent?: string
  importance?: string
} = {}) {
  const params: Record<string, string> = {}
  if (opts.limit != null) params.limit = String(opts.limit)
  if (opts.offset != null) params.offset = String(opts.offset)
  if (opts.agent) params.agent = opts.agent
  if (opts.importance) params.importance = opts.importance
  return backendFetch<Finding[]>('/api/findings', params)
}

export function getFeed(opts: {
  limit?: number
  offset?: number
  date?: string
  since?: string
} = {}) {
  const params: Record<string, string> = { user: 'ramsay' }
  if (opts.limit != null) params.limit = String(opts.limit)
  if (opts.offset != null) params.offset = String(opts.offset)
  if (opts.date) params.date = opts.date
  if (opts.since) params.since = opts.since
  return backendFetch<FeedResponse>('/api/feed', params)
}

export function getStories(opts: { limit?: number; offset?: number } = {}) {
  const params: Record<string, string> = { user: 'ramsay' }
  if (opts.limit != null) params.limit = String(opts.limit)
  if (opts.offset != null) params.offset = String(opts.offset)
  return backendFetch<StoriesResponse>('/api/stories', params)
}

// Detail payloads only change when the pipeline publishes or backfills, so
// they cache for a full day with the content version in the key: latest
// briefing date + findings count both move on every publish, rotating every
// key at once. The data cache survives deploys, so a redeploy no longer sends
// every deep click back to Fly.
const DETAIL_REVALIDATE = 86_400

// An unknown version must not cache for a day. Before this, a shared
// 'unversioned' key plus DETAIL_REVALIDATE meant one slow minute pinned that
// minute's answers site-wide for 24 hours, which is how the site kept serving
// the previous day's content long after the pipeline had published.
const UNVERSIONED_REVALIDATE = 60

// The version lookup costs two backend calls, so it runs at most once per
// process per minute rather than once per detail fetch. Concurrent callers
// share the in-flight promise, so a single render pass makes one lookup no
// matter how many detail fetches it starts.
const VERSION_TTL_MS = 60_000
// When the lookup fails, back off before asking again. A wedged backend used
// to get two extra requests from every render, which kept it wedged.
const VERSION_FAILURE_BACKOFF_MS = 10_000
// A slow lookup must not delay the render it protects.
const VERSION_TIMEOUT_MS = 3_000

// value === null means "never learned a version, do not ask again yet".
let versionCache: { value: string | null; expiresAt: number } | null = null
let versionInFlight: Promise<string | null> | null = null
// Wall-clock deadline shared by every caller of the current lookup, so a
// render that arrives late waits only for the time left on it.
let versionDeadline = 0

function lookupContentVersion(): Promise<string | null> {
  if (versionInFlight) return versionInFlight
  const lookup = (async () => {
    // Latest briefing date and findings count both move on every publish, so
    // together they rotate every detail cache key at once.
    const [stats, reports] = await Promise.all([getStats(), getReports()])
    const latest = reports.map((r) => r.date).sort().at(-1) ?? 'none'
    return `${latest}.${stats.findings}`
  })()
  versionDeadline = Date.now() + VERSION_TIMEOUT_MS
  versionInFlight = lookup
    .then((value) => {
      versionCache = { value, expiresAt: Date.now() + VERSION_TTL_MS }
      return value
    })
    .catch(() => {
      // A failed refresh must not throw away a version that still works. The
      // key only rotates when the pipeline publishes, so yesterday's key is
      // still correct for yesterday's content, and dropping it sent every
      // detail path from one backend fetch a day to one a minute, aimed at the
      // box that was already failing its health check.
      const last = versionCache?.value ?? null
      versionCache = { value: last, expiresAt: Date.now() + VERSION_FAILURE_BACKOFF_MS }
      return last
    })
    .finally(() => {
      versionInFlight = null
    })
  return versionInFlight
}

// Returns null when the version is not known right now. Callers must then
// fall back to a short-lived cache entry, never to a shared long-lived one.
async function contentVersion(): Promise<string | null> {
  const cached = versionCache
  if (cached && cached.expiresAt > Date.now()) return cached.value
  if (cached?.value) {
    // Stale but usable. Refresh behind the render instead of making it wait,
    // and keep serving the last known key for the few seconds that takes.
    void lookupContentVersion()
    return cached.value
  }
  // Next runs generateMetadata alongside the page render, so several callers
  // reach here in one pass. They join the in-flight lookup rather than each
  // taking a bare key, which is what fetched the same story twice on a cold
  // instance, once under ?v= for a day and once bare for a minute.
  const joining = versionInFlight !== null
  const lookup = lookupContentVersion()
  const budget = joining ? Math.max(0, versionDeadline - Date.now()) : VERSION_TIMEOUT_MS
  if (budget === 0) return null
  let timer: ReturnType<typeof setTimeout> | undefined
  // The timer is cleared either way: an unfired 3s timeout would otherwise
  // hold the serverless invocation open past the response.
  const timeout = new Promise<null>((resolve) => {
    timer = setTimeout(() => resolve(null), budget)
  })
  try {
    return await Promise.race([lookup, timeout])
  } finally {
    clearTimeout(timer)
  }
}

async function detailFetch<T>(path: string, params: Record<string, string> = {}): Promise<T> {
  const version = await contentVersion()
  return backendFetch<T>(
    path,
    version ? { ...params, v: version } : params,
    { revalidate: version ? DETAIL_REVALIDATE : UNVERSIONED_REVALIDATE },
  )
}

export async function getStory(slug: string): Promise<PublicStory | null> {
  try {
    return await detailFetch<PublicStory>(`/api/stories/${encodeURIComponent(slug)}`, {
      user: 'ramsay',
    })
  } catch (err) {
    if (isBackendNotFound(err)) return null
    throw err
  }
}

export function getTrending(opts: { limit?: number } = {}) {
  return backendFetch<{ kind: 'trending'; items: import('./types').TrendingStory[]; total: number }>(
    '/api/trending',
    { user: 'ramsay', limit: String(opts.limit ?? 30) },
  )
}

export function getPopular(opts: { window?: 'all' | '7d'; limit?: number } = {}) {
  return backendFetch<{ kind: 'popular'; items: import('./types').TrendingStory[]; total: number }>(
    '/api/popular',
    { user: 'ramsay', window: opts.window ?? 'all', limit: String(opts.limit ?? 30) },
  )
}

export function getReports() {
  return backendFetch<ReportListItem[]>('/api/reports', { user: 'ramsay' })
}

export type ArchiveLookup = {
  state: 'listed' | 'absent' | 'unreachable'
  list: ReportListItem[]
  title?: string
}

// A date this recent has almost certainly been published: the pipeline has run
// every day since launch. Older gaps are real gaps in the archive.
const ARCHIVE_RECENT_DAYS = 30

function isRecentDate(date: string): boolean {
  const at = Date.parse(`${date}T00:00:00Z`)
  if (Number.isNaN(at)) return false
  return Date.now() - at < ARCHIVE_RECENT_DAYS * 86_400_000
}

/**
 * Tells "this date was never published" apart from "the backend did not
 * answer", for both date routes.
 *
 * Both used to end at the same not-found return, whose bare metadata inherits
 * the root card, so a live briefing unfurled as the generic site link and that
 * render was then cached for an hour. It is also the fast path: the per-date
 * endpoints take up to 10s to answer for a date that was never published, so
 * the cached list is consulted first.
 *
 * `/api/reports` answers `[]` with a 200 only when the reports directory is
 * missing, so an empty list for a date inside the last month is a degraded box
 * rather than an empty archive. The window keeps an unmounted volume from
 * turning the whole back catalogue into indexable retry pages.
 */
export async function lookupArchive(date: string): Promise<ArchiveLookup> {
  let list: ReportListItem[]
  try {
    list = await getReports()
  } catch {
    return { state: 'unreachable', list: [] }
  }
  const match = list.find((r) => r.date === date)
  if (match) return { state: 'listed', list, title: match.title }
  if (list.length === 0 && isRecentDate(date)) return { state: 'unreachable', list }
  return { state: 'absent', list }
}

// The backend answers a missing date with a 200 `null` body, not a 404.
export function getReport(date: string) {
  return detailFetch<Report | null>(`/api/reports/${encodeURIComponent(date)}`, { user: 'ramsay' })
}

export function getAudioBriefings() {
  return backendFetch<AudioBriefing[]>('/api/audio-briefings', { user: 'ramsay' })
}

// Null means the backend does not have this date. Every other failure is
// rethrown, so `backendOutcome` can tell a real gap from a degraded box and a
// caller that wants the fragment best-effort catches at its own call site.
export async function getAudioBriefing(date: string): Promise<AudioBriefing | null> {
  try {
    return await detailFetch<AudioBriefing>(`/api/audio-briefings/${encodeURIComponent(date)}`, {
      user: 'ramsay',
    })
  } catch (err) {
    if (isBackendNotFound(err)) return null
    throw err
  }
}

export async function getStructuredIssue(date: string): Promise<PublicIssue | null> {
  try {
    return await detailFetch<PublicIssue>(
      `/api/issues/${encodeURIComponent(date)}/structured`,
      { user: 'ramsay' },
    )
  } catch (err) {
    if (isBackendNotFound(err)) return null
    throw err
  }
}

export async function getEntity(slug: string): Promise<PublicEntity | null> {
  try {
    return await detailFetch<PublicEntity>(`/api/entities/${encodeURIComponent(slug)}`, {
      user: 'ramsay',
      limit: '40',
    })
  } catch (err) {
    if (isBackendNotFound(err)) return null
    throw err
  }
}

export function getSources(opts: { limit?: number } = {}) {
  const params: Record<string, string> = {}
  if (opts.limit != null) params.limit = String(opts.limit)
  return backendFetch<Source[]>('/api/sources', params)
}

export async function getSourceByDomain(domain: string): Promise<Source | null> {
  try {
    const source = await detailFetch<Source>(`/api/sources/${encodeURIComponent(domain)}`, {
      user: 'ramsay',
      limit: '40',
    })
    return {
      ...source,
      url_domain: source.url_domain || source.domain || domain,
      hit_count: source.hit_count ?? source.counts?.findings ?? 0,
      high_value_count: source.high_value_count ?? 0,
      last_seen: source.last_seen ?? '',
      display_name: source.display_name || source.domain || domain,
    }
  } catch (err) {
    if (!isBackendNotFound(err)) throw err
    const normalized = domain.toLowerCase().replace(/^www\./, '')
    const sources = await getSources({ limit: 500 })
    return (
      sources.find((source) => source.url_domain.toLowerCase().replace(/^www\./, '') === normalized) ??
      null
    )
  }
}

export async function getFindingsForSource(domain: string, opts: { limit?: number } = {}) {
  const source = await getSourceByDomain(domain)
  if (source?.findings) return source.findings.slice(0, opts.limit ?? 40)
  return []
}

export async function getFinding(id: number): Promise<Finding | null> {
  try {
    return await detailFetch<Finding>(`/api/findings/${id}`, { user: 'ramsay' })
  } catch (err) {
    if (!isBackendNotFound(err)) throw err
    try {
      return await detailFetch<Finding>(`/api/finding/${id}`, { user: 'ramsay' })
    } catch (fallbackErr) {
      if (isBackendNotFound(fallbackErr)) return null
      throw fallbackErr
    }
  }
}

/** The shape a page shows when a finding has no related trail to offer. */
export function emptyRelated(id: number): RelatedResponse {
  return { kind: 'related', finding_id: id, mode: 'semantic', items: [], total: 0 }
}

export async function getRelated(id: number, opts: { limit?: number } = {}): Promise<RelatedResponse> {
  try {
    return await detailFetch<RelatedResponse>(`/api/related/${id}`, {
      user: 'ramsay',
      mode: 'blended',
      limit: String(opts.limit ?? 8),
    })
  } catch (err) {
    if (isBackendNotFound(err)) return emptyRelated(id)
    throw err
  }
}

export async function getNarrativeArc(id: string, date?: string): Promise<NarrativeArc | null> {
  if (!date) return null
  try {
    return await backendFetch<NarrativeArc>(`/api/narrative-arcs/${encodeURIComponent(id)}`, {
      user: 'ramsay',
      date,
    })
  } catch (err) {
    if (isBackendNotFound(err)) return null
    throw err
  }
}
