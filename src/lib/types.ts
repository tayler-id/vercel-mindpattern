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
  source_refs?: SourceRef[]
  entities?: EntityRef[]
  related_paths?: RelatedFindingPath[]
  connector_labels?: string[]
  connectors?: RelatedConnector[]
}

export interface RelatedConnector {
  kind: string
  label: string
  detail?: string
  weight?: number
  evidence: Array<{
    kind: string
    id?: string
    url?: string
    domain?: string
    target_url?: string
    similarity?: number
    term?: string
    signal?: string
  }>
}

export interface RelatedFindingPath extends Finding {
  mode?: string
  connector_labels?: string[]
  connectors?: RelatedConnector[]
}

export interface RelatedResponse {
  kind: 'related'
  finding_id: number
  mode: 'semantic' | string
  items: RelatedFindingPath[]
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

export interface RelatedStoryPath {
  kind: string
  id: string | number
  slug?: string
  title: string
  summary?: string
  target_url?: string
  relationship?: string
  reason: string
  connector_labels?: string[]
  connectors?: RelatedConnector[]
}

export interface PublicStory {
  kind: 'story'
  id: string
  slug: string
  story_unit_id?: string
  issue_date: string
  date?: string
  issue_title?: string
  issue_url?: string
  section_id?: string
  title: string
  summary: string
  dek?: string
  take?: string
  why_now?: string
  body_excerpt: string
  body_markdown?: string
  source_refs: SourceRef[]
  source_trail?: SourceRef[]
  entity_refs: EntityRef[]
  finding_ids: number[]
  primary_finding_ids?: number[]
  supporting_finding_ids?: number[]
  arc_ids: string[]
  graph_edges?: GraphEdge[]
  graph_connectors?: {
    issue_date?: string
    source_urls?: string[]
    source_domains?: string[]
    entity_ids?: string[]
    topic_terms?: string[]
    finding_ids?: number[]
    arc_ids?: string[]
  }
  related_paths: RelatedStoryPath[]
  target_url: string
  confidence: 'source-backed' | string
  labels: string[]
  json_ld_ready: boolean
  claim_evidence: unknown[]
  provenance: {
    generated_by: string
    generated_at: string | null
    input_artifacts: string[]
    source_issue_dates: string[]
    source_story_unit_id?: string
    source_finding_ids?: number[]
    redaction_status: 'passed' | 'redacted' | 'failed' | string
    ai_generated: boolean
    human_approved: boolean
  }
}

export interface StoriesResponse {
  kind: 'stories'
  items: PublicStory[]
  total: number
  limit: number
  offset: number
  has_more: boolean
}

export interface Source {
  id?: number
  url_domain: string
  kind?: 'source'
  domain?: string
  status?: string
  display_name: string
  hit_count: number
  high_value_count: number
  last_seen: string
  created_at?: string
  counts?: {
    findings: number
    entities: number
  }
  findings?: Finding[]
  entities?: EntityRef[]
  pagination?: {
    limit: number
    offset: number
    has_more: boolean
  }
  provenance?: {
    generated_by: string
    redaction_status: string
  }
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
  published_story?: PublishedStoryRef
}

export interface PublishedStoryRef {
  story_unit_id: string
  slug: string
  title: string
  target_url: string
  confidence: string
  source_domains?: string[]
  entity_ids?: string[]
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
  published_story_refs?: PublishedStoryRef[]
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

export interface CorpusEntityRelationship {
  source: string
  relationship: string
  related_entity?: string
  related_entity_slug?: string
  related_entity_type?: string
  entity_a?: string
  entity_a_type?: string
  entity_b?: string
  entity_b_type?: string
  fact_text?: string
  fact_type?: string
  confidence?: number
  finding_id?: number | null
  target_url?: string
  created_at?: string
  evidence_edges?: GraphEdge[]
}

export interface KgEntity {
  id: number
  name: string
  kind: string
  description: string
  mention_count: number
  importance: number
  first_seen: string
  last_seen: string
}

export interface PublicEntity {
  kind: 'entity'
  slug: string
  name: string
  user: string
  status?: string
  confidence: 'source-backed' | string
  counts?: {
    story_units?: number
    findings: number
    relationships: number
    sources: number
  }
  pagination?: {
    limit: number
    offset: number
    has_more: boolean
  }
  story_units: EntityStoryUnit[]
  findings: Finding[]
  relationships: CorpusEntityRelationship[]
  kg_entities: KgEntity[]
  source_trail: SourceRef[]
  issue_dates: string[]
  graph_sources: string[]
  total: number
  limit: number
  provenance: {
    generated_by: string
    source_issue_dates: string[]
    graph_sources: string[]
    redaction_status: 'passed' | 'redacted' | 'failed' | string
    ai_generated: boolean
  }
}

export interface GraphEdge {
  kind: string
  relationship: string
  id: string
  label?: string
  target_url?: string
  evidence?: string
}

export interface NarrativeArc {
  id: string
  title: string
  summary: string
  status: string
  first_seen: string
  last_seen: string
  evidence_count: number
  date_count: number
  source_domain_count: number
  agent_count: number
  scores: Record<string, number>
  evidence: Array<{
    finding_id: number | null
    run_date: string
    agent: string
    title: string
    summary: string
    source_url: string
    source_name: string
  }>
}
