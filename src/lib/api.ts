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

// Detail pages are ISR-cached, so error semantics matter: only a backend 404
// may become a notFound() (cacheable), while timeouts/5xx must throw so the
// error boundary renders and the bad response is never cached as real content.
export class BackendError extends Error {
  constructor(
    public readonly status: number,
    path: string,
  ) {
    super(`Backend ${status}: ${path}`)
  }
}

export function isBackendNotFound(err: unknown): boolean {
  return err instanceof BackendError && err.status === 404
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
  const res = await fetch(url.toString(), {
    next: { revalidate: opts?.revalidate ?? 300 },
    signal: AbortSignal.timeout(BACKEND_TIMEOUT_MS),
  })
  if (!res.ok) throw new BackendError(res.status, path)
  return res.json()
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

async function contentVersion(): Promise<string> {
  const version = (async () => {
    const [stats, reports] = await Promise.all([getStats(), getReports()])
    const latest = reports.map((r) => r.date).sort().at(-1) ?? 'none'
    return `${latest}.${stats.findings}`
  })()
  // A slow version lookup must not delay the render it protects — fall back
  // to a shared unversioned key and let the next render pick up the real one.
  return Promise.race([
    version.catch(() => 'unversioned'),
    new Promise<string>((resolve) => setTimeout(() => resolve('unversioned'), 3000)),
  ])
}

async function detailFetch<T>(path: string, params: Record<string, string> = {}): Promise<T> {
  return backendFetch<T>(
    path,
    { ...params, v: await contentVersion() },
    { revalidate: DETAIL_REVALIDATE },
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

// The per-date detail endpoints take up to 10s to answer for dates that don't
// exist yet (e.g. today's briefing before the pipeline runs), so date pages
// must consult the cached archive list before firing them. Returns null when
// the list itself is unavailable — callers fall back to the detail fetch.
export async function reportExists(date: string): Promise<boolean | null> {
  try {
    const list = await getReports()
    return list.some((r) => r.date === date)
  } catch {
    return null
  }
}

// The backend answers a missing date with a 200 `null` body, not a 404.
export function getReport(date: string) {
  return detailFetch<Report | null>(`/api/reports/${date}`, { user: 'ramsay' })
}

export function getAudioBriefings() {
  return backendFetch<AudioBriefing[]>('/api/audio-briefings', { user: 'ramsay' })
}

export async function getAudioBriefing(date: string): Promise<AudioBriefing | null> {
  try {
    return await detailFetch<AudioBriefing>(`/api/audio-briefings/${date}`, { user: 'ramsay' })
  } catch {
    return null
  }
}

export async function getStructuredIssue(date: string): Promise<PublicIssue | null> {
  try {
    return await detailFetch<PublicIssue>(`/api/issues/${date}/structured`, { user: 'ramsay' })
  } catch {
    return null
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

export async function getRelated(id: number, opts: { limit?: number } = {}): Promise<RelatedResponse> {
  try {
    return await detailFetch<RelatedResponse>(`/api/related/${id}`, {
      user: 'ramsay',
      mode: 'blended',
      limit: String(opts.limit ?? 8),
    })
  } catch {
    return {
      kind: 'related',
      finding_id: id,
      mode: 'semantic',
      items: [],
      total: 0,
    }
  }
}

export async function getNarrativeArc(id: string, date?: string): Promise<NarrativeArc | null> {
  if (!date) return null
  try {
    return await backendFetch<NarrativeArc>(`/api/narrative-arcs/${encodeURIComponent(id)}`, {
      user: 'ramsay',
      date,
    })
  } catch {
    return null
  }
}
