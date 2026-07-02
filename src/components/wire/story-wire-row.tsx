import Link from 'next/link'
import type { PublicStory } from '@/lib/types'
import { sourceLabel } from '@/lib/sections'
import { SourceFavicon } from './source-favicon'
import { TrendIndicator } from './trend-indicator'

export function StoryWireRow({
  story,
  rank,
}: {
  story: PublicStory & { trend?: string; views?: number; source_count?: number; entity_count?: number }
  rank: number
}) {
  const hot = rank <= 3
  const primarySource = story.source_refs[0] ?? null
  const sourceCount = story.source_refs.length || story.source_count || 0
  const entityCount = story.entity_refs.length || story.entity_count || 0

  return (
    <Link
      href={`/s/${encodeURIComponent(story.slug)}`}
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
        <div className="flex items-center gap-2 font-mono text-[0.625rem] font-semibold uppercase text-primary">
          <span>{story.issue_date} / {story.confidence}</span>
          <TrendIndicator trend={story.trend} />
          {typeof story.views === 'number' && (
            <span className="normal-case text-ink-faint">{story.views.toLocaleString()} reads</span>
          )}
        </div>
        <h3 className="mt-[5px] text-[1.03125rem] font-semibold leading-[1.32] text-ink">
          {story.title}
        </h3>
        {story.summary && (
          <p className="mt-1.5 line-clamp-2 font-serif text-[0.9375rem] leading-[1.55] text-[#30343b]">
            {story.summary}
          </p>
        )}
        <div className="mt-[9px] flex flex-wrap items-center gap-x-3 gap-y-1.5 font-mono text-[0.65625rem] text-ink-faint">
          {primarySource && (
            <span className="inline-flex min-w-0 items-center gap-1.5">
              <SourceFavicon url={primarySource.url} name={primarySource.title || primarySource.domain} />
              <span className="truncate">{sourceLabel(primarySource.title, primarySource.url)}</span>
            </span>
          )}
          <span>{sourceCount} sources</span>
          {entityCount > 0 && <span>{entityCount} entities</span>}
        </div>
      </div>
    </Link>
  )
}
