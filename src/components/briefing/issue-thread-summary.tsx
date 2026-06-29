import Link from 'next/link'
import type { PublicIssue } from '@/lib/types'

export function IssueThreadSummary({ issue }: { issue: PublicIssue }) {
  if (!issue.story_units.length) return null

  const entityById = new Map(issue.entities.map((entity) => [entity.id, entity]))

  return (
    <aside className="mb-8 border-y border-line py-5" aria-label="Briefing graph">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h2 className="font-mono text-[0.6875rem] font-semibold uppercase tracking-[0.12em] text-ink">
          Thread summary
        </h2>
        <p className="font-mono text-[0.65625rem] text-ink-faint">
          {issue.story_units.length} stories · {issue.source_trail.length} sources
        </p>
      </div>

      <div className="mt-4 space-y-5">
        {issue.sections.map((section) => {
          const stories = issue.story_units.filter((story) => story.section_id === section.id)
          if (!stories.length) return null

          return (
            <section key={section.id}>
              <h3 className="font-mono text-[0.625rem] font-bold uppercase tracking-[0.1em] text-primary">
                {section.title}
              </h3>
              <ol className="mt-2 divide-y divide-line-soft">
                {stories.map((story) => {
                  const entities = story.entity_ids
                    .map((entityId) => entityById.get(entityId))
                    .filter(Boolean)
                  const storyHref = story.source_refs.length
                    ? `/s/${encodeURIComponent(story.id)}`
                    : null

                  return (
                    <li key={story.id} className="py-3">
                      {storyHref ? (
                        <Link
                          href={storyHref}
                          className="text-[0.9375rem] font-semibold leading-snug text-ink hover:text-primary"
                        >
                          {story.title}
                        </Link>
                      ) : (
                        <div className="text-[0.9375rem] font-semibold leading-snug text-ink">
                          {story.title}
                        </div>
                      )}
                      {story.summary && (
                        <p className="mt-1 line-clamp-2 font-serif text-[0.9375rem] leading-[1.55] text-[#30343b]">
                          {story.summary}
                        </p>
                      )}
                      <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 font-mono text-[0.625rem] text-ink-faint">
                        {story.source_refs.slice(0, 3).map((source) => (
                          <Link
                            key={`${story.id}-${source.url}`}
                            href={`/source/${encodeURIComponent(source.domain)}`}
                            className="text-primary hover:underline"
                          >
                            {source.title || source.domain}
                          </Link>
                        ))}
                        {entities.slice(0, 4).map((entity) => (
                          <Link
                            key={`${story.id}-${entity?.id}`}
                            href={`/e/${encodeURIComponent(entity?.slug ?? '')}`}
                            className="text-primary hover:underline"
                          >
                            {entity?.name}
                          </Link>
                        ))}
                      </div>
                    </li>
                  )
                })}
              </ol>
            </section>
          )
        })}
      </div>
    </aside>
  )
}
