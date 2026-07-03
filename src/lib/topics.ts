/**
 * THE topic registry — the single source of category truth (audit §C).
 * 11 real sections from the pipeline, grouped into 7 fixed color families.
 * Color = category, identical at every touchpoint (row, rail, graph, story
 * page). `top-5-stories-today` is a RANK flag, never a topic. Unknown or
 * missing sections get NO hue and NO pill.
 */
export interface Topic {
  id: string
  label: string
  /** saturated hue: fills, floods, graph nodes */
  fill: string
  /** AA-safe variant for text on white */
  text: string
  /** text color when sitting ON the fill */
  on: string
}

const T = (id: string, label: string, fill: string, text: string, on = '#ffffff'): Topic => ({
  id, label, fill, text, on,
})

export const TOPICS: Topic[] = [
  T('models', 'Models', '#e63b12', '#b32d0e'),
  T('agents', 'Agents', '#1e63d0', '#1a56b4'),
  T('research', 'Research', '#cf2d7b', '#ad2465'),
  T('tools-developer-experience', 'Tools', '#0797a6', '#067282'),
  T('vibe-coding', 'Vibe Coding', '#0797a6', '#067282'),
  T('hot-projects-oss', 'OSS', '#0797a6', '#067282'),
  T('skills-of-the-day', 'Skills', '#f5c518', '#8a6d0a', '#0e0e0f'),
  T('saas-disruption', 'Markets', '#33517e', '#33517e'),
  T('infrastructure-architecture', 'Infra', '#33517e', '#33517e'),
  T('security', 'Security', '#5b5546', '#5b5546'),
  T('policy-governance', 'Policy', '#5b5546', '#5b5546'),
]

const BY_ID = new Map(TOPICS.map((t) => [t.id, t]))

export const TOP5_SECTION = 'top-5-stories-today'

/** Findings carry `agent`, not a section — map agents into the taxonomy.
    Agents without a topical home keep an informative neutral label. */
const AGENT_TOPIC: Record<string, string> = {
  'agents-researcher': 'agents',
  'arxiv-researcher': 'research',
  'skill-finder': 'skills-of-the-day',
  'vibe-coding-researcher': 'vibe-coding',
  'projects-researcher': 'hot-projects-oss',
  'github-pulse-researcher': 'tools-developer-experience',
  'saas-disruption-researcher': 'saas-disruption',
}

const AGENT_LABEL: Record<string, string> = {
  'news-researcher': 'News',
  'hn-researcher': 'Hacker News',
  'reddit-researcher': 'Reddit',
  'rss-researcher': 'Dispatch',
  'sources-researcher': 'Sources',
  'thought-leaders-researcher': 'Voices',
  orchestrator: 'Desk',
}

export function topicFor(sectionId: string | null | undefined): Topic | null {
  if (!sectionId) return null
  return BY_ID.get(sectionId.trim().toLowerCase()) ?? null
}

export function topicForAgent(agent: string | null | undefined): Topic | null {
  if (!agent) return null
  return topicFor(AGENT_TOPIC[agent.trim().toLowerCase()])
}

export function isTop5(sectionId: string | null | undefined): boolean {
  return (sectionId || '').trim().toLowerCase() === TOP5_SECTION
}

/** Kicker label for any section/agent — topic label, agent label, or ''. */
export function kickerLabel(sectionOrAgent: string | null | undefined): string {
  if (!sectionOrAgent) return ''
  const key = sectionOrAgent.trim().toLowerCase()
  if (key === TOP5_SECTION) return 'Top 5'
  return BY_ID.get(key)?.label ?? topicForAgent(key)?.label ?? AGENT_LABEL[key] ?? ''
}

const NEUTRAL_VARS = { '--tc': 'var(--ink)', '--tc-text': 'var(--ink-soft)', '--tc-on': '#ffffff' }

/** Style vars for .flood-row / .tag-chip / kickers / page accents. */
export function topicStyleVars(topic: Topic | null): Record<string, string> {
  if (!topic) return NEUTRAL_VARS
  return { '--tc': topic.fill, '--tc-text': topic.text, '--tc-on': topic.on }
}
