import type {
  AudioBriefing,
  FeedResponse,
  Finding,
  PublicIssue,
  RelatedResponse,
  Report,
  ReportListItem,
  Source,
  Stats,
} from './types'

const BACKEND_URL = process.env.BACKEND_API_URL || 'https://mindpattern.fly.dev'

export async function backendFetch<T>(
  path: string,
  params?: Record<string, string>,
): Promise<T> {
  const url = new URL(path, BACKEND_URL)
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v) url.searchParams.set(k, v)
    })
  }
  const res = await fetch(url.toString(), {
    next: { revalidate: 60 },
  })
  if (!res.ok) throw new Error(`Backend ${res.status}: ${path}`)
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

export function getReports() {
  return backendFetch<ReportListItem[]>('/api/reports', { user: 'ramsay' })
}

export function getReport(date: string) {
  return backendFetch<Report>(`/api/reports/${date}`, { user: 'ramsay' })
}

export function getAudioBriefings() {
  return backendFetch<AudioBriefing[]>('/api/audio-briefings', { user: 'ramsay' })
}

export async function getAudioBriefing(date: string): Promise<AudioBriefing | null> {
  try {
    return await backendFetch<AudioBriefing>(`/api/audio-briefings/${date}`, { user: 'ramsay' })
  } catch {
    return null
  }
}

export async function getStructuredIssue(date: string): Promise<PublicIssue | null> {
  try {
    return await backendFetch<PublicIssue>(`/api/issues/${date}/structured`, { user: 'ramsay' })
  } catch {
    return null
  }
}

export function getSources(opts: { limit?: number } = {}) {
  const params: Record<string, string> = {}
  if (opts.limit != null) params.limit = String(opts.limit)
  return backendFetch<Source[]>('/api/sources', params)
}

export async function getSourceByDomain(domain: string): Promise<Source | null> {
  const normalized = domain.toLowerCase().replace(/^www\./, '')
  const sources = await getSources({ limit: 500 })
  return (
    sources.find((source) => source.url_domain.toLowerCase().replace(/^www\./, '') === normalized) ??
    null
  )
}

export async function getFindingsForSource(domain: string, opts: { limit?: number } = {}) {
  const normalized = domain.toLowerCase().replace(/^www\./, '')
  const findings = await getFindings({ limit: 2000 })
  return findings
    .filter((finding) => {
      if (!finding.source_url) return false
      try {
        return new URL(finding.source_url).hostname.replace(/^www\./, '').toLowerCase() === normalized
      } catch {
        return false
      }
    })
    .slice(0, opts.limit ?? 40)
}

export async function getFinding(id: number): Promise<Finding | null> {
  try {
    return await backendFetch<Finding>(`/api/finding/${id}`, { user: 'ramsay' })
  } catch {
    try {
      const findings = await getFindings({ limit: 300 })
      return findings.find((f) => f.id === id) ?? null
    } catch {
      return null
    }
  }
}

export async function getRelated(id: number, opts: { limit?: number } = {}): Promise<RelatedResponse> {
  try {
    return await backendFetch<RelatedResponse>(`/api/related/${id}`, {
      user: 'ramsay',
      mode: 'semantic',
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
