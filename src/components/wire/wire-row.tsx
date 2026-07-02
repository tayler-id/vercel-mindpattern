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
      className="group grid grid-cols-[30px_1fr] items-start gap-4 rounded-xl border-b border-line-soft px-3 py-[15px] transition-[background,box-shadow] hover:border-b-transparent hover:bg-surface hover:shadow-[0_1px_2px_rgba(11,13,18,.05),0_12px_32px_-22px_rgba(11,13,18,.32)] active:bg-spine sm:gap-[18px] sm:px-4"
    >
      <span
        className={`pt-px text-right font-mono text-sm tabular-nums ${
          hot ? 'font-bold text-primary' : 'font-medium text-ink-faint'
        }`}
      >
        {rank}
      </span>

      <div className="min-w-0">
        <div className="font-mono text-[0.625rem] font-semibold uppercase tracking-[0.1em] text-primary">
          {sectionLabel(finding.agent)}
        </div>
        <h3 className="mt-[5px] text-[1.03125rem] font-semibold leading-[1.32] tracking-[-0.01em] text-ink">
          {finding.title}
        </h3>
        {finding.summary && (
          <p className="mt-1.5 line-clamp-2 font-serif text-[0.9375rem] leading-[1.55] text-[#30343b]">
            {finding.summary}
          </p>
        )}
        <div className="mt-[9px] flex flex-wrap items-center gap-x-3 gap-y-1.5 font-mono text-[0.65625rem] text-ink-faint">
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
