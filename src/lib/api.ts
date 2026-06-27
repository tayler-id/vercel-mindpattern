import type { Finding, Report, ReportListItem, Source, Stats } from './types'

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

export function getReports() {
  return backendFetch<ReportListItem[]>('/api/reports', { user: 'ramsay' })
}

export function getReport(date: string) {
  return backendFetch<Report>(`/api/reports/${date}`, { user: 'ramsay' })
}

export function getSources(opts: { limit?: number } = {}) {
  const params: Record<string, string> = {}
  if (opts.limit != null) params.limit = String(opts.limit)
  return backendFetch<Source[]>('/api/sources', params)
}

/**
 * Fetch a single finding by id.
 * TODO(T8): replace the batch-find with a real `/api/findings/{id}` v3 endpoint;
 * this covers the Wire's recent findings only.
 */
export async function getFinding(id: number): Promise<Finding | null> {
  const findings = await getFindings({ limit: 300 })
  return findings.find((f) => f.id === id) ?? null
}
