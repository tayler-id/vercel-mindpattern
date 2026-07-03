import Link from 'next/link'
import type { PublicStory } from '@/lib/types'
import { sectionLabel } from '@/lib/sections'
import { topicVars } from '@/lib/topic-color'

/**
 * "THE FULL WIRE" — the complete story list, compact rows. No inner
 * scrollbox: the page scrolls naturally. Mono index + topic dot + title;
 * hover tints the row and underlines the title in its topic color.
 */
export function FullWireRail({ stories, total }: { stories: PublicStory[]; total: number }) {
  return (
    <section aria-labelledby="full-wire-heading">
      <div className="mb-1 flex items-baseline gap-3 border-t-[3px] border-ink pt-2.5">
        <h2
          id="full-wire-heading"
          className="type-display text-[15px] uppercase tracking-[0.02em]"
          style={{ fontVariationSettings: '"wdth" 115', fontWeight: 850 }}
        >
          The wire
        </h2>
        <span className="font-mono text-[10.5px] uppercase tracking-[0.12em] text-ink-soft">
          {stories.length < total
            ? `latest ${stories.length.toLocaleString('en-US')} of ${total.toLocaleString('en-US')}`
            : `${total.toLocaleString('en-US')} stories`}
        </span>
      </div>
      <ol>
        {stories.map((story, i) => {
          const label = sectionLabel(story.section_id || '')
          return (
            <li key={story.slug}>
              <Link
                href={`/s/${encodeURIComponent(story.slug)}`}
                style={topicVars(label) as React.CSSProperties}
                className="scroll-rise group grid grid-cols-[32px_1fr] items-baseline gap-3 border-t border-line px-2 py-2.5 transition-[background-color,transform] duration-(--dur-fast) hover:bg-panel active:scale-[0.99]"
              >
                <span className="font-mono text-[10.5px] text-ink-soft">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span
                  className="text-[13.5px] leading-[1.25] text-ink decoration-ink decoration-2 underline-offset-[3px] group-hover:underline group-active:underline"
                  style={{ fontVariationSettings: '"wdth" 105', fontWeight: 640 }}
                >
                  {story.title}
                </span>
              </Link>
            </li>
          )
        })}
      </ol>
    </section>
  )
}
