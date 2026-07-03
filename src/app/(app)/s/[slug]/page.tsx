import type { Metadata } from 'next'
import type { CSSProperties } from 'react'
import Link from 'next/link'
import { TrackedLink } from '@/components/analytics/tracked-link'
import { ScrollDepthTracker } from '@/components/analytics/scroll-depth'
import { notFound } from 'next/navigation'
import { JsonLd } from '@/components/json-ld'
import { ReportMarkdown } from '@/components/briefing/report-markdown'
import { ShareButton } from '@/components/story/share-button'
import { getStory } from '@/lib/api'
import { isTop5, kickerLabel, topicFor, topicStyleVars } from '@/lib/topics'
import { absoluteUrl, SITE_NAME } from '@/lib/site'

export const revalidate = 60

type Params = { params: Promise<{ slug: string }> }

const STORY_SLUG_RE = /^[a-z0-9][a-z0-9-]{0,127}$/i

function cleanSlug(raw: string): string | null {
  const slug = decodeURIComponent(raw).toLowerCase()
  return STORY_SLUG_RE.test(slug) && !slug.includes('..') ? slug : null
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug: raw } = await params
  const slug = cleanSlug(raw)
  if (!slug) return { title: 'Story not found' }

  const story = await getStory(slug)
  if (!story) return { title: 'Story not found' }

  return {
    title: story.title,
    description: (story.summary || story.dek || story.take || '').slice(0, 160),
    alternates: { canonical: `/s/${story.slug}` },
  }
}

export default async function StoryPage({ params }: Params) {
  const { slug: raw } = await params
  const slug = cleanSlug(raw)
  if (!slug) notFound()

  const story = await getStory(slug)
  if (!story) notFound()
  const bodyMarkdown = story.body_markdown || story.body_excerpt || story.summary
  const issueHref = story.issue_url || `/briefings/${story.issue_date}`
  const summary = story.summary || story.dek || story.take || ''
  const topic = topicFor(story.section_id)
  const sectionName = isTop5(story.section_id)
    ? 'Top 5'
    : kickerLabel(story.section_id) || 'Public story'

  return (
    <div className="h-full overflow-y-auto" style={topicStyleVars(topic) as CSSProperties}>
      <div className="progress-rail" aria-hidden />
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'Article',
          '@id': absoluteUrl(`/s/${story.slug}#story`),
          headline: story.title,
          description: summary,
          url: absoluteUrl(`/s/${story.slug}`),
          datePublished: story.issue_date,
          dateModified: story.issue_date,
          isPartOf: {
            '@type': 'WebSite',
            name: SITE_NAME,
            url: absoluteUrl('/'),
          },
          author: {
            '@type': 'Organization',
            name: SITE_NAME,
            url: absoluteUrl('/'),
          },
          citation: story.source_refs.map((source) => source.url),
          about: story.entity_refs.slice(0, 12).map((entity) => ({
            '@type': 'Thing',
            name: entity.name,
            url: absoluteUrl(`/e/${entity.slug}`),
          })),
        }}
      />

      <main className="pb-24">
        <ScrollDepthTracker kind="story" id={story.slug} />

        {/* ── Hero ── */}
        <header className="relative mx-auto max-w-[1080px] px-8 pb-2 pt-10 max-sm:px-5 max-sm:pt-6">
          <Link
            href="/"
            className="rise-in type-kicker inline-block text-ink-soft transition-colors duration-[var(--dur-fast)] hover:text-ink focus-visible:outline-2 focus-visible:outline-ink focus-visible:outline-offset-2"
            style={{ '--i': 0 } as CSSProperties}
          >
            ← The Wire
          </Link>

          <p className="rise-in type-kicker mt-6 text-[color:var(--tc-text)]" style={{ '--i': 1 } as CSSProperties}>
            {sectionName} · {story.issue_date} · {story.confidence}
          </p>
          <h1
            className="rise-in type-display relative z-[1] mt-2 max-w-[24ch] text-[clamp(2.25rem,5vw,3.5rem)] leading-[1.05] tracking-[-0.02em] text-ink"
            style={{ '--i': 2, fontVariationSettings: '"wdth" 114', fontWeight: 850 } as CSSProperties}
          >
            {story.title}
          </h1>
          {story.dek && (
            <p className="rise-in mt-2 max-w-[56ch] font-serif text-[1.3125rem] leading-[1.45] text-ink-soft" style={{ '--i': 3 } as CSSProperties}>
              {story.dek}
            </p>
          )}
          {story.why_now && (
            <p className="rise-in mt-3 max-w-[64ch] font-mono text-[0.75rem] leading-relaxed text-ink-faint" style={{ '--i': 4 } as CSSProperties}>
              Why now: {story.why_now}
            </p>
          )}

          {/* Folio strip — 3px ink rule, mono label/value pairs */}
          <div className="rise-in mt-8 flex flex-wrap items-center gap-x-9 gap-y-3 border-t-[3px] border-ink py-3" style={{ '--i': 5 } as CSSProperties}>
            <div>
              <div className="type-kicker text-ink-faint">Issue</div>
              <TrackedLink
                href={issueHref}
                event="briefing_click"
                eventProps={{ from: story.slug, date: story.issue_date }}
                className="mt-0.5 block font-mono text-[0.75rem] font-semibold text-ink hover:underline"
              >
                {story.issue_date}
              </TrackedLink>
            </div>
            <div>
              <div className="type-kicker text-ink-faint">Confidence</div>
              <div className="mt-0.5 font-mono text-[0.75rem] font-semibold uppercase text-ink">{story.confidence}</div>
            </div>
            <div>
              <div className="type-kicker text-ink-faint">Sources</div>
              <div className="mt-0.5 font-mono text-[0.75rem] font-semibold text-ink">{story.source_refs.length}</div>
            </div>
            <div>
              <div className="type-kicker text-ink-faint">Redaction</div>
              <div className="mt-0.5 font-mono text-[0.75rem] font-semibold uppercase text-ink">{story.provenance.redaction_status}</div>
            </div>
            <ShareButton title={story.title} className="ml-auto" />
          </div>
        </header>

        {/* ── Body column ── */}
        <div className="mx-auto max-w-[720px] px-8 max-sm:px-5">
          {story.take && (
            <aside className="scroll-rise mt-6 rounded-[20px] p-7 max-sm:px-5" style={{ background: 'var(--tc)' }}>
              <span className="type-kicker inline-block rounded-full bg-paper px-4 py-1 text-[color:var(--tc-text)]">
                The take
              </span>
              <p
                className="mt-3 text-[1.3125rem] leading-[1.25]"
                style={{ color: 'var(--tc-on)', fontVariationSettings: '"wdth" 106', fontWeight: 680 }}
              >
                {story.take}
              </p>
            </aside>
          )}

          {bodyMarkdown && (
            <section className="mt-8">
              <h2 className="type-kicker text-ink">Story</h2>
              <div className="mt-3">
                <ReportMarkdown content={bodyMarkdown} />
              </div>
            </section>
          )}
        </div>

        {/* ── Related: flood rows ── */}
        {story.related_paths.length > 0 && (
          <section className="scroll-rise mx-auto mt-10 max-w-[720px] px-8 max-sm:px-5">
            <h2 className="type-display border-t-[3px] border-ink pt-2.5 text-[25px] uppercase leading-[1.04] text-ink">
              Related stories
            </h2>
            <p className="mb-2 mt-1 font-mono text-[0.6875rem] text-ink-faint">
              Each link below shares sources, entities, or timing with this story.
            </p>
            <ol>
              {story.related_paths.slice(0, 8).map((related, index) => {
                const vars = topicStyleVars(null) as CSSProperties
                const labels = (related.connector_labels || ['Connected']).join(' / ')
                const prevLabels =
                  index > 0
                    ? (story.related_paths[index - 1].connector_labels || ['Connected']).join(' / ')
                    : null
                const inner = (
                  <>
                    <div className="min-w-0">
                      {labels !== prevLabels && (
                        <p className="type-kicker text-ink-faint">{labels}</p>
                      )}
                      <h3 className="type-display mt-2 text-[1.1875rem] leading-[1.1] text-ink">{related.title}</h3>
                      <p className="mt-2 font-serif text-[0.9375rem] leading-[1.5] text-ink-soft">
                        {related.reason || related.summary}
                      </p>
                    </div>
                  </>
                )
                return (
                  <li key={`${related.id}-${index}`} className="flood-row rule-row group" style={vars}>
                    {related.target_url ? (
                      <TrackedLink
                        href={related.target_url}
                        event="related_click"
                        eventProps={{
                          from: story.slug,
                          to: String(related.slug || related.target_url),
                          connectors: (related.connector_labels || []).join(' / '),
                        }}
                        className="grid grid-cols-[1fr_auto] gap-5 px-4 py-4"
                      >
                        {inner}
                      </TrackedLink>
                    ) : (
                      <div className="grid grid-cols-[1fr_auto] gap-5 px-4 py-4">{inner}</div>
                    )}
                  </li>
                )
              })}
            </ol>
          </section>
        )}

        <div className="mx-auto max-w-[720px] px-8 max-sm:px-5">
          {/* ── Source trail: pill links ── */}
          <section className="scroll-rise mt-10 border-t border-ink pt-5">
            <h2 className="type-kicker text-ink">Source trail</h2>
            <div className="mt-3 flex flex-wrap gap-3">
              {story.source_refs.map((source) => (
                <TrackedLink
                  key={source.url}
                  href={`/source/${encodeURIComponent(source.domain)}`}
                  event="source_click"
                  eventProps={{ from: story.slug, domain: source.domain }}
                  className="inline-block rounded-full bg-panel px-4 py-2 font-mono text-[0.65625rem] font-semibold uppercase tracking-[0.1em] text-ink transition-all duration-[var(--dur-fast)] ease-[var(--ease-swift)] hover:-translate-y-0.5 hover:bg-ink hover:text-white focus-visible:outline-2 focus-visible:outline-ink focus-visible:outline-offset-2"
                >
                  {source.title || source.domain}
                </TrackedLink>
              ))}
            </div>
          </section>

          {story.entity_refs.length > 0 && (
            <section className="scroll-rise mt-10 border-t border-ink pt-5">
              <h2 className="type-kicker text-ink">Entities</h2>
              <div className="mt-3 flex flex-wrap gap-3">
                {story.entity_refs.slice(0, 16).map((entity) => (
                  <TrackedLink
                    key={entity.id}
                    href={`/e/${encodeURIComponent(entity.slug)}`}
                    event="entity_click"
                    eventProps={{ from: story.slug, entity: entity.slug }}
                    className="inline-block rounded-full bg-panel px-4 py-2 font-mono text-[0.65625rem] font-semibold uppercase tracking-[0.1em] text-ink transition-all duration-[var(--dur-fast)] ease-[var(--ease-swift)] hover:-translate-y-0.5 hover:bg-ink hover:text-white focus-visible:outline-2 focus-visible:outline-ink focus-visible:outline-offset-2"
                  >
                    {entity.name}
                  </TrackedLink>
                ))}
              </div>
            </section>
          )}

          {story.claim_evidence.length > 0 && (
            <section className="scroll-rise mt-10 border-t border-ink pt-5">
              <h2 className="type-kicker text-ink">Claim evidence</h2>
              <ol className="mt-3">
                {story.claim_evidence.slice(0, 8).map((item, index) => {
                  const evidence = item as { claim?: string; source_url?: string; finding_id?: number | null }
                  return (
                    <li key={`${evidence.finding_id ?? index}-${evidence.claim ?? ''}`} className="border-t border-line py-3 first:border-t-0">
                      <div className="font-serif text-[0.9375rem] leading-[1.58] text-ink-prose">
                        {evidence.claim}
                      </div>
                      <div className="type-kicker mt-2 flex flex-wrap gap-3 text-[color:var(--tc-text)]">
                        {evidence.finding_id != null && (
                          <Link href={`/f/${evidence.finding_id}`} className="hover:underline">
                            Finding {evidence.finding_id}
                          </Link>
                        )}
                        {evidence.source_url && (
                          <TrackedLink
                            href={evidence.source_url}
                            external
                            event="outbound_source_click"
                            eventProps={{ from: story.slug }}
                            className="hover:underline"
                          >
                            Source
                          </TrackedLink>
                        )}
                      </div>
                    </li>
                  )
                })}
              </ol>
            </section>
          )}

          <section className="scroll-rise mt-10 border-t border-ink pt-5">
            <h2 className="type-kicker text-ink">Provenance</h2>
            <dl className="mt-4 grid grid-cols-1 gap-x-6 gap-y-2.5 sm:grid-cols-2">
              <div className="border-t border-line pt-2.5">
                <dt className="type-kicker text-ink-faint">Canonical issue</dt>
                <dd className="mt-0.5 font-mono text-[0.75rem] text-ink">
                  <Link href={issueHref} className="text-[color:var(--tc-text)] hover:underline">
                    {story.issue_title || story.issue_date}
                  </Link>
                </dd>
              </div>
              <div className="border-t border-line pt-2.5">
                <dt className="type-kicker text-ink-faint">AI generated</dt>
                <dd className="mt-0.5 font-mono text-[0.75rem] text-ink">{story.provenance.ai_generated ? 'yes' : 'no'}</dd>
              </div>
              <div className="border-t border-line pt-2.5">
                <dt className="type-kicker text-ink-faint">Story unit</dt>
                <dd className="mt-0.5 font-mono text-[0.75rem] text-ink">{story.provenance.source_story_unit_id || story.provenance.source_finding_ids?.join(', ') || 'site artifact'}</dd>
              </div>
              <div className="border-t border-line pt-2.5">
                <dt className="type-kicker text-ink-faint">Labels</dt>
                <dd className="mt-0.5 font-mono text-[0.75rem] text-ink">{story.labels.length ? story.labels.join(', ') : 'source-backed'}</dd>
              </div>
            </dl>
          </section>
        </div>
      </main>
    </div>
  )
}
