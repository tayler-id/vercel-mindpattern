/** Turn an agent id into a Wire kicker, e.g. "vibe-coding-researcher" → "VIBE CODING". */
export function agentLabel(agent: string): string {
  return agent
    .replace(/-(researcher|finder)$/, '')
    .replace(/[-_]/g, ' ')
    .trim()
    .toUpperCase()
}

/** Compact date like "Jun 26". */
export function shortDate(iso: string): string {
  const d = new Date(iso + (iso.length === 10 ? 'T00:00:00' : ''))
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}
