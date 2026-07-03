import Link from 'next/link'
import type { CSSProperties } from 'react'
import type { PublicStory } from '@/lib/types'
import { sectionLabel, sourceLabel } from '@/lib/sections'
import { accentVars, isCanonicalTopic, topicVars } from '@/lib/topic-color'
import { SourceFavicon } from './source-favicon'
import { TrendIndicator } from './trend-indicator'

export function StoryWireRow({
  story,
  rank,
}: {
  story: PublicStory & { trend?: string; views?: number; source_count?: number; entity_count?: number }
  rank: number
}) {
  const primarySource = story.source_refs[0] ?? null
  const sourceCount = story.source_refs.length || story.source_count || 0
  const entityCount = story.entity_refs.length || story.entity_count || 0
  const section = sectionLabel(story.section_id || '')
  const style = {
    ...(isCanonicalTopic(section) ? topicVars(section) : accentVars()),
    '--i': String(rank - 1),
  } as CSSProperties

  return (
    <Link
      href={`/s/${encodeURIComponent(story.slug)}`}
      style={style}
      className="flood-row rule-row rise-in scroll-rise group grid grid-cols-[88px_1fr_auto] items-start gap-5 px-4 py-5 transition-transform duration-(--dur-fast) focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ink active:scale-[0.99] max-sm:grid-cols-[64px_1fr] max-sm:gap-3 max-sm:px-3"
    >
      <span className="num-outline pt-1 text-[50px] max-sm:text-[38px]" aria-hidden>
        {String(rank).padStart(2, '0')}
      </span>

      <div className="min-w-0">
        <p className="type-kicker mb-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-(--tc-text) transition-colors group-hover:text-(--tc-on) group-focus-within:text-(--tc-on)">
          <span>
            {[section, story.issue_date, story.confidence].filter(Boolean).join(' · ')}
          </span>
          <TrendIndicator trend={story.trend} />
          {typeof story.views === 'number' && (
            <span className="text-ink-faint transition-colors group-hover:text-(--tc-on) group-focus-within:text-(--tc-on)">
              {story.views.toLocaleString('en-US')} reads
            </span>
          )}
        </p>
        <h3
          className="type-display text-[25px] leading-[1.04] max-sm:text-[19px]"
          style={{ fontVariationSettings: '"wdth" 108', fontWeight: 760 }}
        >
          {story.title}
        </h3>
        {story.summary && (
          <p className="mt-2 line-clamp-2 max-w-[58ch] text-[14px] leading-[1.55] text-ink-soft transition-colors group-hover:text-(--tc-on) group-focus-within:text-(--tc-on)">
            {story.summary}
          </p>
        )}
        <p className="type-kicker mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-ink-faint transition-colors group-hover:text-(--tc-on) group-focus-within:text-(--tc-on)">
          {primarySource && (
            <span className="inline-flex min-w-0 items-center gap-1.5">
              <SourceFavicon
                url={primarySource.url}
                name={primarySource.title || primarySource.domain}
              />
              <span className="truncate">{sourceLabel(primarySource.title, primarySource.url)}</span>
            </span>
          )}
          <span>{sourceCount} sources</span>
          {entityCount > 0 && <span>{entityCount} entities</span>}
        </p>
      </div>

      {isCanonicalTopic(section) ? <span className="tag-chip self-center max-sm:hidden">{section}</span> : null}
    </Link>
  )
}
