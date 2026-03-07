export interface Finding {
  id: number
  run_date: string
  agent: string
  title: string
  summary: string
  importance: 'high' | 'medium' | 'low'
  source_url: string | null
  source_name: string | null
  similarity?: number
}

export interface Source {
  url_domain: string
  display_name: string
  hit_count: number
  high_value_count: number
  last_seen: string
}

export interface Pattern {
  theme: string
  description: string
  recurrence_count: number
  first_seen: string
  last_seen: string
}

export interface Skill {
  id: number
  run_date: string
  domain: string
  title: string
  description: string
  steps: string | null
  difficulty: string
  source_url: string | null
  source_name: string | null
  similarity?: number
}

export interface Stats {
  findings: number
  sources: number
  patterns: number
  skills: number
  by_agent: Record<string, number>
  by_date: Record<string, number>
}

export interface HealthData {
  pipeline_runs: Array<{
    run_date: string
    total_findings: number
    unique_sources: number
    high_value_count: number
    agent_utilization: number
    overall_score: number
  }>
  agent_stats: Array<{
    agent: string
    note_type: string
    count: number
  }>
  recent_errors: Array<{
    run_date: string
    agent: string
    note_type: string
    content: string
    created_at: string
  }>
  approval_summary: {
    pending: number
    decided: number
  }
}

export interface ReportListItem {
  date: string
  title: string
  filename: string
  size: number
}

export interface Report {
  date: string
  title: string
  content: string
  filename: string
}

export interface ReportSearchResult {
  date: string
  title: string
  excerpt: string
  filename: string
}
