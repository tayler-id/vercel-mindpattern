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
      className="rule-row group grid grid-cols-[56px_1fr] items-start gap-4 px-3 py-4 transition-colors hover:bg-spine active:bg-panel sm:gap-[18px] sm:px-4"
    >
      <span
        className="numeral-ghost pt-1.5 text-right text-[44px]"
        style={hot ? { color: 'color-mix(in oklab, var(--accent) 34%, transparent)' } : undefined}
      >
        {rank}
      </span>

      <div className="min-w-0">
        <div className="type-kicker flex items-center gap-2 text-primary">
          <span>{story.issue_date} / {story.confidence}</span>
          <TrendIndicator trend={story.trend} />
          {typeof story.views === 'number' && (
            <span className="text-ink-faint">{story.views.toLocaleString()} reads</span>
          )}
        </div>
        <h3 className="type-display mt-1.5 text-[1.3125rem] font-[560] text-ink underline-offset-[3px] group-hover:underline">
          {story.title}
        </h3>
        {story.summary && (
          <p className="mt-1.5 line-clamp-2 font-serif text-[0.9375rem] leading-[1.55] text-ink-soft">
            {story.summary}
          </p>
        )}
        <div className="type-kicker mt-[9px] flex flex-wrap items-center gap-x-3 gap-y-1.5 text-ink-faint">
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
