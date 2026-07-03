import type { ReactNode } from 'react'
import type { Stats } from '@/lib/types'
import { sectionLabel } from '@/lib/sections'

/**
 * Monochrome live ticker under the header. Server-rendered content, CSS
 * `.ticker` marquee (content duplicated for a seamless loop). No colored
 * dots — ink/gray mono text only. Static under reduced motion.
 */
export function WireTicker({ stats, today }: { stats: Stats; today: number }) {
  const bySection = new Map<string, number>()
  for (const [agent, count] of Object.entries(stats.by_agent)) {
    const label = sectionLabel(agent)
    bySection.set(label, (bySection.get(label) ?? 0) + count)
  }
  const sections = [...bySection.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6)

  const date = new Date()
    .toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    })
    .toUpperCase()
    .replace(',', '')

  const segment: ReactNode = (
    <>
      <b className="font-semibold text-ink">LIVE</b> · {date} ·{' '}
      <b className="font-semibold text-ink">{stats.findings.toLocaleString('en-US')}</b> FINDINGS ·{' '}
      <b className="font-semibold text-ink">+{today}</b>/DAY
      {sections.map(([label, count]) => (
        <span key={label}>
          {' '}
          · {label} {count.toLocaleString('en-US')}
        </span>
      ))}
    </>
  )

  return (
    <div className="border-b border-line">
      <p className="sr-only">
        Live wire: {stats.findings.toLocaleString('en-US')} findings indexed, {today} added today.
      </p>
      <div
        className="ticker flex h-[34px] items-center font-mono text-[11px] tracking-[0.1em] text-ink-faint"
        aria-hidden="true"
      >
        <span>
          {segment}
          {'  ·  '}
          {segment}
          {'  ·  '}
        </span>
      </div>
    </div>
  )
}
