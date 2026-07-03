/**
 * Spectrum topic → color mapping. Color IS the taxonomy: a topic/section name
 * hashes to a stable slot in the 5-hue spectrum defined in globals.css.
 *
 * `base` is the saturated hue (fills, floods, chips, rules).
 * `text` is the AA-safe variant for text on white (yellow needs a dark twin).
 * `on` is the text color to use when sitting ON a flood of `base`.
 */
export type TopicColor = { base: string; text: string; on: string }

const SLOTS: TopicColor[] = [
  { base: 'var(--spectrum-1)', text: 'var(--spectrum-1)', on: '#ffffff' },
  { base: 'var(--spectrum-2)', text: 'var(--spectrum-2)', on: '#ffffff' },
  { base: 'var(--spectrum-3)', text: 'var(--spectrum-3)', on: '#ffffff' },
  { base: 'var(--spectrum-4)', text: 'var(--spectrum-4-text)', on: 'var(--ink)' },
]

export function topicColor(name: string | null | undefined): TopicColor {
  if (!name) return SLOTS[0]
  let h = 0
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) | 0
  return SLOTS[Math.abs(h) % SLOTS.length]
}

/** Inline style vars for .flood-row / .tag-chip / .type-kicker consumers. */
export function topicVars(name: string | null | undefined): Record<string, string> {
  const c = topicColor(name)
  return { '--tc': c.base, '--tc-text': c.text, '--tc-on': c.on }
}
