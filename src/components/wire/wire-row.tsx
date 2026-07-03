import Link from 'next/link'
import type { Finding } from '@/lib/types'
import { sectionLabel, leaderFrom, sourceLabel } from '@/lib/sections'
import { SourceFavicon } from './source-favicon'
import { ViaAvatar } from './via-avatar'

export function WireRow({ finding, rank }: { finding: Finding; rank: number }) {
  const hot = rank <= 3
  const leader = leaderFrom(finding.source_url)

  return (
    <Link
      href={`/f/${finding.id}`}
      className="rule-row group grid grid-cols-[56px_1fr] items-start gap-4 px-3 py-4 transition-colors hover:bg-spine active:bg-panel sm:gap-[18px] sm:px-4"
    >
      <span
        className="numeral-ghost pt-1.5 text-right text-[44px]"
        style={hot ? { color: 'color-mix(in oklab, var(--accent) 34%, transparent)' } : undefined}
      >
        {rank}
      </span>

      <div className="min-w-0">
        <div className="type-kicker text-primary">
          {sectionLabel(finding.agent)}
        </div>
        <h3 className="type-display mt-1.5 text-[1.3125rem] font-[560] text-ink underline-offset-[3px] group-hover:underline">
          {finding.title}
        </h3>
        {finding.summary && (
          <p className="mt-1.5 line-clamp-2 font-serif text-[0.9375rem] leading-[1.55] text-ink-soft">
            {finding.summary}
          </p>
        )}
        <div className="type-kicker mt-[9px] flex flex-wrap items-center gap-x-3 gap-y-1.5 text-ink-faint">
          <span className="inline-flex min-w-0 items-center gap-1.5">
            <SourceFavicon url={finding.source_url} name={finding.source_name} />
            <span className="truncate">{sourceLabel(finding.source_name, finding.source_url)}</span>
          </span>
          {leader && <ViaAvatar name={leader.name} avatar={leader.avatar} />}
        </div>
      </div>
    </Link>
  )
}
