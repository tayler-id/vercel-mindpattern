import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { JsonLd } from '@/components/json-ld'
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
    description: story.summary.slice(0, 160),
    alternates: { canonical: `/s/${story.slug}` },
  }
}

export default async function StoryPage({ params }: Params) {
  const { slug: raw } = await params
  const slug = cleanSlug(raw)
  if (!slug) notFound()

  const story = await getStory(slug)
  if (!story) notFound()

  return (
    <div className="h-full overflow-y-auto">
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'Article',
          '@id': absoluteUrl(`/s/${story.slug}#story`),
          headline: story.title,
          description: story.summary,
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
          <p className="mt-4 font-serif text-[1.0625rem] leading-[1.72] text-[#30343b]">
            {story.summary}
          </p>

          <div className="mt-5 grid grid-cols-2 gap-3 font-mono text-[0.6875rem] text-ink-faint sm:grid-cols-4">
            <div>
              <div className="text-ink">Issue</div>
              <Link href={story.issue_url} className="text-primary hover:underline">
                {story.issue_date}
              </Link>
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

        {story.body_excerpt && story.body_excerpt !== story.summary && (
          <section className="mt-7">
            <h2 className="font-mono text-[0.6875rem] font-semibold uppercase text-ink">
              Thread excerpt
            </h2>
            <p className="mt-3 font-serif text-[1rem] leading-[1.72] text-[#30343b]">
              {story.body_excerpt}
            </p>
          </section>
        )}

        <section className="mt-8 border-t border-line pt-5">
          <h2 className="font-mono text-[0.6875rem] font-semibold uppercase text-ink">
            Source trail
          </h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {story.source_refs.map((source) => (
              <Link
                key={source.url}
                href={`/source/${encodeURIComponent(source.domain)}`}
                className="inline-block rounded-lg border border-line px-2.5 py-1.5 font-mono text-[0.71875rem] text-primary hover:border-primary hover:bg-accent-wash"
              >
                {source.title || source.domain}
              </Link>
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
                <Link
                  key={entity.id}
                  href={`/e/${encodeURIComponent(entity.slug)}`}
                  className="inline-block rounded-lg border border-line px-2.5 py-1.5 font-mono text-[0.71875rem] text-primary hover:border-primary hover:bg-accent-wash"
                >
                  {entity.name}
                </Link>
              ))}
            </div>
          </section>
        )}

        {story.related_paths.length > 0 && (
          <section className="mt-8 border-t border-line pt-5">
            <h2 className="font-mono text-[0.6875rem] font-semibold uppercase text-ink">
              Related paths
            </h2>
            <ol className="mt-3 divide-y divide-line">
              {story.related_paths.map((related) => (
                <li key={related.id}>
                  <Link
                    href={related.target_url}
                    className="block py-4 transition-colors hover:bg-accent-wash"
                  >
                    <div className="font-mono text-[0.625rem] font-semibold uppercase text-primary">
                      {related.relationship.replaceAll('_', ' ')}
                    </div>
                    <h3 className="mt-1.5 text-[1rem] font-semibold leading-snug text-ink">
                      {related.title}
                    </h3>
                    <p className="mt-2 line-clamp-2 font-serif text-[0.9375rem] leading-[1.58] text-[#30343b]">
                      {related.summary || related.reason}
                    </p>
                  </Link>
                </li>
              ))}
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
                <Link href={story.issue_url} className="text-primary hover:underline">
                  {story.issue_title}
                </Link>
              </dd>
            </div>
            <div>
              <dt className="text-ink">AI generated</dt>
              <dd>{story.provenance.ai_generated ? 'yes' : 'no'}</dd>
            </div>
            <div>
              <dt className="text-ink">Story unit</dt>
              <dd>{story.provenance.source_story_unit_id}</dd>
            </div>
            <div>
              <dt className="text-ink">Labels</dt>
              <dd>{story.labels.join(', ')}</dd>
            </div>
          </dl>
        </section>
      </main>
    </div>
  )
}
