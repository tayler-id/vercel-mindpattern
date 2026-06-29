export interface Finding {
  id: number
  kind?: 'finding'
  run_date: string
  agent: string
  title: string
  summary: string
  importance: 'high' | 'medium' | 'low'
  category?: string
  source_url: string | null
  source_name: string | null
  similarity?: number
  score?: number
  relationship?: string
  reason?: string
  target_url?: string
}

export interface RelatedResponse {
  kind: 'related'
  finding_id: number
  mode: 'semantic' | string
  items: Finding[]
  total: number
}

export interface FeedItem extends Finding {
  rank: number
  target_type: 'finding' | 'story' | string
  target_id: string
  target_url: string
  confidence?: string
}

export interface FeedResponse {
  kind: 'feed'
  items: FeedItem[]
  total: number
  limit: number
  offset: number
}

export interface Source {
  id?: number
  url_domain: string
  display_name: string
  hit_count: number
  high_value_count: number
  last_seen: string
  created_at?: string
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
  subtitle?: string
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

export interface AudioSourceNote {
  label: string
  url: string
}

export interface AudioBriefing {
  id: string
  type: 'audio_briefing'
  date: string
  user: string
  status: 'ready' | 'degraded' | 'failed' | string
  generated_at: string
  provider: string
  model: string
  voice: string
  source_count: number
  duration_seconds: number
  has_audio_file: boolean
  audio_placeholder: boolean
  source_report_hash: string
  script_hash: string
  audio_hash: string
  labels: string[]
  show_notes: AudioSourceNote[]
  public_url: string
  transcript_url: string
}

export interface SourceRef {
  url: string
  domain: string
  title: string
}

export interface EntityRef {
  id: string
  slug: string
  name: string
  kind: string
}

export interface IssueSection {
  id: string
  slug: string
  title: string
  order: number
  summary: string
  story_unit_ids: string[]
}

export interface IssueStoryUnit {
  id: string
  slug: string
  issue_date: string
  section_id: string
  title: string
  summary: string
  body_excerpt: string
  finding_ids: number[]
  entity_ids: string[]
  source_refs: SourceRef[]
  arc_ids: string[]
  order: number
}

export interface PublicIssue {
  date: string
  user: string
  title: string
  slug: string
  sections: IssueSection[]
  entities: EntityRef[]
  story_units: IssueStoryUnit[]
  source_trail: SourceRef[]
  generated_at: string
  provenance: {
    generated_by: string
    generated_at: string
    input_artifacts: string[]
    source_finding_ids: number[]
    source_issue_dates: string[]
    redaction_status: 'passed' | 'redacted' | 'failed' | string
    ai_generated: boolean
    human_approved: boolean
  }
}

export interface EntityStoryUnit {
  id: string
  slug: string
  issue_date: string
  issue_title: string
  section_id: string
  title: string
  summary: string
  source_refs: SourceRef[]
  arc_ids: string[]
  finding_ids: number[]
  target_url: string
}

export interface PublicEntity {
  kind: 'entity'
  slug: string
  name: string
  user: string
  confidence: 'source-backed' | string
  story_units: EntityStoryUnit[]
  source_trail: SourceRef[]
  issue_dates: string[]
  total: number
  limit: number
  provenance: {
    generated_by: string
    source_issue_dates: string[]
    redaction_status: 'passed' | 'redacted' | 'failed' | string
    ai_generated: boolean
  }
}
