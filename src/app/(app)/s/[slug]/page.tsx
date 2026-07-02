import type { Metadata } from 'next'
import Link from 'next/link'
import { TrackedLink } from '@/components/analytics/tracked-link'
import { ScrollDepthTracker } from '@/components/analytics/scroll-depth'
import { notFound } from 'next/navigation'
import { JsonLd } from '@/components/json-ld'
import { ReportMarkdown } from '@/components/briefing/report-markdown'
import { getStory } from '@/lib/api'
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

  return (
    <div className="h-full overflow-y-auto">
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

      <main className="mx-auto max-w-[760px] px-8 pb-24 pt-9 max-sm:px-5">
        <ScrollDepthTracker kind="story" id={story.slug} />
        <Link
          href="/"
          className="font-mono text-[0.6875rem] font-semibold uppercase text-primary hover:underline"
        >
          The Wire
        </Link>

        <header className="mt-8 border-b border-line pb-6">
          <div className="font-mono text-[0.6875rem] font-semibold uppercase text-primary">
            Public story
          </div>
          <h1 className="mt-3 font-serif text-[2.35rem] font-semibold leading-[1.08] text-ink max-sm:text-[1.8rem]">
            {story.title}
          </h1>
          {story.dek && (
            <p className="mt-4 font-serif text-[1.0625rem] leading-[1.72] text-[#30343b]">
              {story.dek}
            </p>
          )}
          {story.take && (
            <div className="mt-3 rounded border border-primary/25 bg-primary/[0.04] px-4 py-3">
              <div className="font-mono text-[0.625rem] font-semibold uppercase tracking-wider text-primary">
                The take
              </div>
              <p className="mt-1.5 font-serif text-[1rem] leading-[1.68] text-ink">
                {story.take}
              </p>
            </div>
          )}
          {story.why_now && (
            <p className="mt-3 font-mono text-[0.75rem] leading-relaxed text-ink-faint">
              Why now: {story.why_now}
            </p>
          )}

          <div className="mt-5 grid grid-cols-2 gap-3 font-mono text-[0.6875rem] text-ink-faint sm:grid-cols-4">
            <div>
              <div className="text-ink">Issue</div>
              <TrackedLink
                href={issueHref}
                event="briefing_click"
                eventProps={{ from: story.slug, date: story.issue_date }}
                className="text-primary hover:underline"
              >
                {story.issue_date}
              </TrackedLink>
            </div>
            <div>
              <div className="text-ink">Sources</div>
              <div>{story.source_refs.length}</div>
            </div>
            <div>
              <div className="text-ink">Confidence</div>
              <div>{story.confidence}</div>
            </div>
            <div>
              <div className="text-ink">Redaction</div>
              <div>{story.provenance.redaction_status}</div>
            </div>
          </div>
        </header>

        {bodyMarkdown && (
          <section className="mt-7">
            <h2 className="font-mono text-[0.6875rem] font-semibold uppercase text-ink">
              Story
            </h2>
            <div className="mt-3">
              <ReportMarkdown content={bodyMarkdown} />
            </div>
          </section>
        )}

        {story.related_paths.length > 0 && (
          <section className="mt-8 border-t border-line pt-5">
            <h2 className="font-mono text-[0.6875rem] font-semibold uppercase text-ink">
              Related stories
            </h2>
            <p className="mt-1 font-mono text-[0.6875rem] text-ink-faint">
              Paths through the public graph — every connection is backed by shared evidence.
            </p>
            <ol className="mt-3 divide-y divide-line">
              {story.related_paths.slice(0, 8).map((related, index) => (
                <li key={`${related.id}-${index}`} className="py-3">
                  <div className="font-mono text-[0.625rem] font-semibold uppercase text-primary">
                    {(related.connector_labels || ['Connected']).join(' / ')}
                  </div>
                  {related.target_url ? (
                    <TrackedLink
                      href={related.target_url}
                      event="related_click"
                      eventProps={{
                        from: story.slug,
                        to: String(related.slug || related.target_url),
                        connectors: (related.connector_labels || []).join(' / '),
                      }}
                      className="mt-1.5 block text-[0.9375rem] font-semibold text-ink hover:text-primary"
                    >
                      {related.title}
                    </TrackedLink>
                  ) : (
                    <div className="mt-1.5 text-[0.9375rem] font-semibold text-ink">{related.title}</div>
                  )}
                  <p className="mt-1 font-serif text-[0.9375rem] leading-[1.58] text-[#30343b]">
                    {related.reason || related.summary}
                  </p>
                </li>
              ))}
            </ol>
          </section>
        )}

        <section className="mt-8 border-t border-line pt-5">
          <h2 className="font-mono text-[0.6875rem] font-semibold uppercase text-ink">
            Source trail
          </h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {story.source_refs.map((source) => (
              <TrackedLink
                key={source.url}
                href={`/source/${encodeURIComponent(source.domain)}`}
                event="source_click"
                eventProps={{ from: story.slug, domain: source.domain }}
                className="inline-block rounded-lg border border-line px-2.5 py-1.5 font-mono text-[0.71875rem] text-primary hover:border-primary hover:bg-accent-wash"
              >
                {source.title || source.domain}
              </TrackedLink>
            ))}
          </div>
        </section>

        {story.entity_refs.length > 0 && (
          <section className="mt-8 border-t border-line pt-5">
            <h2 className="font-mono text-[0.6875rem] font-semibold uppercase text-ink">
              Entities
            </h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {story.entity_refs.slice(0, 16).map((entity) => (
                <TrackedLink
                  key={entity.id}
                  href={`/e/${encodeURIComponent(entity.slug)}`}
                  event="entity_click"
                  eventProps={{ from: story.slug, entity: entity.slug }}
                  className="inline-block rounded-lg border border-line px-2.5 py-1.5 font-mono text-[0.71875rem] text-primary hover:border-primary hover:bg-accent-wash"
                >
                  {entity.name}
                </TrackedLink>
              ))}
            </div>
          </section>
        )}

        {story.claim_evidence.length > 0 && (
          <section className="mt-8 border-t border-line pt-5">
            <h2 className="font-mono text-[0.6875rem] font-semibold uppercase text-ink">
              Claim evidence
            </h2>
            <ol className="mt-3 divide-y divide-line">
              {story.claim_evidence.slice(0, 8).map((item, index) => {
                const evidence = item as { claim?: string; source_url?: string; finding_id?: number | null }
                return (
                  <li key={`${evidence.finding_id ?? index}-${evidence.claim ?? ''}`} className="py-3">
                    <div className="font-serif text-[0.9375rem] leading-[1.58] text-[#30343b]">
                      {evidence.claim}
                    </div>
                    <div className="mt-1 flex flex-wrap gap-3 font-mono text-[0.625rem] text-primary">
                      {evidence.finding_id != null && <Link href={`/f/${evidence.finding_id}`}>Finding {evidence.finding_id}</Link>}
                      {evidence.source_url && (
                        <TrackedLink
                          href={evidence.source_url}
                          external
                          event="outbound_source_click"
                          eventProps={{ from: story.slug }}
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

        <section className="mt-8 border-t border-line pt-5">
          <h2 className="font-mono text-[0.6875rem] font-semibold uppercase text-ink">
            Provenance
          </h2>
          <dl className="mt-3 grid grid-cols-1 gap-3 font-mono text-[0.6875rem] text-ink-faint sm:grid-cols-2">
            <div>
              <dt className="text-ink">Canonical issue</dt>
              <dd>
                <Link href={issueHref} className="text-primary hover:underline">
                  {story.issue_title || story.issue_date}
                </Link>
              </dd>
            </div>
            <div>
              <dt className="text-ink">AI generated</dt>
              <dd>{story.provenance.ai_generated ? 'yes' : 'no'}</dd>
            </div>
            <div>
              <dt className="text-ink">Story unit</dt>
              <dd>{story.provenance.source_story_unit_id || story.provenance.source_finding_ids?.join(', ') || 'site artifact'}</dd>
            </div>
            <div>
              <dt className="text-ink">Labels</dt>
              <dd>{story.labels.length ? story.labels.join(', ') : 'source-backed'}</dd>
            </div>
          </dl>
        </section>
      </main>
    </div>
  )
}
