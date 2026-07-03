import Link from 'next/link'
import type { ReportListItem } from '@/lib/types'

/**
 * The giant briefing circle (rail feature): accent disc linking to the latest
 * daily briefing. CircleBadge geometry per spectrum-system.md §2.1 — text
 * lives in the inscribed square (70% of diameter), title clamped to 3 lines.
 * Drift lives on a wrapper so the hover transform composes cleanly.
 */
export function BriefingCircle({ report }: { report: ReportListItem }) {
  const isToday = report.date === new Date().toISOString().slice(0, 10)
  const dateLabel = new Date(`${report.date}T00:00:00`).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
  const words = Math.max(1, Math.round(report.size / 6))
  const mins = Math.max(1, Math.round(words / 230))

  return (
    <div className="bc-drift mx-auto mb-10 w-[240px]">
      <style>{`
        @keyframes bc-drift { from { transform: translateY(0); } to { transform: translateY(-8px); } }
        .bc-drift { animation: bc-drift 7s ease-in-out infinite alternate; }
      `}</style>
      <Link
        href={`/briefings/${report.date}`}
        className="circle-badge size-[240px] bg-primary text-white transition-transform duration-(--dur-med) ease-(--ease-settle) hover:-rotate-2 hover:scale-105 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink active:scale-95"
      >
        <span className="circle-content">
          <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em]">
            {isToday ? "Today's briefing" : 'Latest briefing'}
          </span>
          <span
            className="circle-title type-display text-[24px] uppercase"
            style={{ fontVariationSettings: '"wdth" 112', fontWeight: 820 }}
          >
            {dateLabel}
          </span>
          <span className="font-mono text-[10.5px] uppercase tracking-[0.14em]">
            ≈{words.toLocaleString('en-US')} words · {mins} min
          </span>
          <span className="mt-1 border-b border-white pb-0.5 font-mono text-[10.5px] font-semibold uppercase tracking-[0.12em]">
            Read it →
          </span>
        </span>
      </Link>
    </div>
  )
}
