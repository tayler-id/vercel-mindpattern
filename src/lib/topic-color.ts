/**
 * Spectrum topic → color mapping. Color IS the taxonomy — and taxonomy means
 * a FIXED registry: each canonical section always gets the same hue, so color
 * carries meaning across the whole site. Anything outside the registry is
 * NEUTRAL ink: no pill, no hue. Never hash junk strings into colors.
 *
 * `base`  — saturated hue (floods, chips, graph nodes)
 * `text`  — AA-safe variant for text on white (yellow needs its dark twin)
 * `on`    — text color when sitting ON a flood of `base`
 */
export type TopicColor = { base: string; text: string; on: string }

const SLOTS: TopicColor[] = [
  { base: 'var(--spectrum-1)', text: 'var(--spectrum-1)', on: '#ffffff' },
  { base: 'var(--spectrum-2)', text: 'var(--spectrum-2)', on: '#ffffff' },
  { base: 'var(--spectrum-3)', text: 'var(--spectrum-3)', on: '#ffffff' },
  { base: 'var(--spectrum-4)', text: 'var(--spectrum-4-text)', on: 'var(--ink)' },
]

const NEUTRAL: TopicColor = { base: 'var(--ink)', text: 'var(--ink-soft)', on: '#ffffff' }

/** Canonical section labels (see sections.ts) with FIXED slot assignments.
    Grouped deliberately: models/agents = orange, tools/skills = teal,
    research/news = magenta, markets/community = yellow. */
const REGISTRY = new Map<string, TopicColor>([
  ['AGENTS', SLOTS[0]],
  ['PROJECTS', SLOTS[0]],
  ['TOOLS', SLOTS[1]],
  ['SKILLS', SLOTS[1]],
  ['DISPATCH', SLOTS[1]],
  ['RESEARCH', SLOTS[2]],
  ['NEWS', SLOTS[2]],
  ['SOURCES', SLOTS[2]],
  ['MARKETS', SLOTS[3]],
  ['HACKER NEWS', SLOTS[3]],
  ['REDDIT', SLOTS[3]],
  ['VOICES', SLOTS[3]],
])

/** True only for sections in the canonical registry — the only ones that
    earn a tag pill or a hue. */
export function isCanonicalTopic(label: string | null | undefined): boolean {
  return !!label && REGISTRY.has(label.trim().toUpperCase())
}

export function topicColor(name: string | null | undefined): TopicColor {
  if (!name) return NEUTRAL
  return REGISTRY.get(name.trim().toUpperCase()) ?? NEUTRAL
}

/** Inline style vars for .flood-row / .tag-chip / .type-kicker consumers. */
export function topicVars(name: string | null | undefined): Record<string, string> {
  const c = topicColor(name)
  return { '--tc': c.base, '--tc-text': c.text, '--tc-on': c.on }
}

/**
 * Identity color — a stable hue per story/date, hashed across the four
 * spectrum slots (never neutral). Used for row floods and graph nodes when
 * no canonical topic exists: the color consistently identifies the ITEM
 * (same story = same hue everywhere), instead of pretending it's a topic.
 */
export function identityColor(key: string): TopicColor {
  let h = 0
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) | 0
  return SLOTS[Math.abs(h) % SLOTS.length]
}

export function identityVars(key: string): Record<string, string> {
  const c = identityColor(key)
  return { '--tc': c.base, '--tc-text': c.text, '--tc-on': c.on }
}

/** THE interaction color. One rule sitewide: ink at rest, accent on touch —
    spectrum hues appear only on true taxonomy (canonical pills, charts). */
export function accentVars(): Record<string, string> {
  return { '--tc': 'var(--accent)', '--tc-text': 'var(--ink-soft)', '--tc-on': '#ffffff' }
}
