import Link from 'next/link'
import type { CSSProperties } from 'react'
import type { Finding } from '@/lib/types'
import { sectionLabel, leaderFrom, sourceLabel } from '@/lib/sections'
import { topicVars } from '@/lib/topic-color'
import { SourceFavicon } from './source-favicon'
import { ViaAvatar } from './via-avatar'

export function WireRow({ finding, rank }: { finding: Finding; rank: number }) {
  const leader = leaderFrom(finding.source_url)
  const section = sectionLabel(finding.agent)
  const style = { ...topicVars(section), '--i': String(rank - 1) } as CSSProperties

  return (
    <Link
      href={`/f/${finding.id}`}
      style={style}
      className="flood-row rule-row rise-in scroll-rise group grid grid-cols-[88px_1fr_auto] items-start gap-5 px-4 py-5 transition-transform duration-(--dur-fast) focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ink active:scale-[0.99] max-sm:grid-cols-[64px_1fr] max-sm:gap-3 max-sm:px-3"
    >
      <span className="num-outline pt-1 text-[50px] max-sm:text-[38px]" aria-hidden>
        {String(rank).padStart(2, '0')}
      </span>

      <div className="min-w-0">
        <p className="type-kicker mb-2 text-(--tc-text) transition-colors group-hover:text-(--tc-on) group-focus-within:text-(--tc-on)">
          {[section, finding.run_date].filter(Boolean).join(' · ')}
        </p>
        <h3
          className="type-display text-[25px] leading-[1.04] max-sm:text-[19px]"
          style={{ fontVariationSettings: '"wdth" 108', fontWeight: 760 }}
        >
          {finding.title}
        </h3>
        {finding.summary && (
          <p className="mt-2 line-clamp-2 max-w-[58ch] text-[14px] leading-[1.55] text-ink-soft transition-colors group-hover:text-(--tc-on) group-focus-within:text-(--tc-on)">
            {finding.summary}
          </p>
        )}
        <p className="type-kicker mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-ink-faint transition-colors group-hover:text-(--tc-on) group-focus-within:text-(--tc-on)">
          <span className="inline-flex min-w-0 items-center gap-1.5">
            <SourceFavicon url={finding.source_url} name={finding.source_name} />
            <span className="truncate">{sourceLabel(finding.source_name, finding.source_url)}</span>
          </span>
          {leader && <ViaAvatar name={leader.name} avatar={leader.avatar} />}
        </p>
      </div>

      {section ? <span className="tag-chip self-center max-sm:hidden">{section}</span> : null}
    </Link>
  )
}
