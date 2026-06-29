import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { JsonLd } from '@/components/json-ld'
import { getEntity } from '@/lib/api'
import { absoluteUrl, SITE_NAME } from '@/lib/site'

export const revalidate = 60

type Params = { params: Promise<{ slug: string }> }

const ENTITY_SLUG_RE = /^[a-z0-9][a-z0-9-]{0,95}$/i

function cleanSlug(raw: string): string | null {
  const slug = decodeURIComponent(raw).toLowerCase()
  return ENTITY_SLUG_RE.test(slug) && !slug.includes('..') ? slug : null
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug: raw } = await params
  const slug = cleanSlug(raw)
  if (!slug) return { title: 'Entity not found' }

  const entity = await getEntity(slug)
  if (!entity) return { title: 'Entity not found' }

  return {
    title: `${entity.name} intelligence trail`,
    description: `MindPattern newsletter stories, sources, and graph evidence connected to ${entity.name}.`,
    alternates: { canonical: `/e/${entity.slug}` },
  }
}

export default async function EntityPage({ params }: Params) {
  const { slug: raw } = await params
  const slug = cleanSlug(raw)
  if (!slug) notFound()

  const entity = await getEntity(slug)
  if (!entity) notFound()

  return (
    <div className="h-full overflow-y-auto">
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'WebPage',
          '@id': absoluteUrl(`/e/${entity.slug}#entity`),
          name: `${entity.name} intelligence trail`,
          url: absoluteUrl(`/e/${entity.slug}`),
          isPartOf: {
            '@type': 'WebSite',
            name: SITE_NAME,
            url: absoluteUrl('/'),
          },
          about: {
            '@type': 'Thing',
            name: entity.name,
          },
          citation: entity.source_trail.slice(0, 12).map((source) => source.url),
        }}
      />

      <main className="mx-auto max-w-[760px] px-8 pb-24 pt-9 max-sm:px-5">
        <Link
          href="/"
          className="font-mono text-[0.6875rem] font-semibold uppercase tracking-[0.08em] text-primary hover:underline"
        >
          The Wire
        </Link>

        <header className="mt-8 border-b border-line pb-6">
          <div className="font-mono text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-primary">
            Entity trail
          </div>
          <h1 className="mt-3 font-serif text-[2.25rem] font-semibold leading-[1.08] tracking-[-0.02em] text-ink max-sm:text-[1.75rem]">
            {entity.name}
          </h1>
          <p className="mt-3 max-w-[38rem] font-serif text-[1rem] leading-[1.72] text-[#30343b]">
            Connected stories, citations, and issue history from the public MindPattern archive.
          </p>

          <div className="mt-5 grid grid-cols-2 gap-3 font-mono text-[0.6875rem] text-ink-faint sm:grid-cols-4">
            <div>
              <div className="text-ink">Stories</div>
              <div>{entity.total}</div>
            </div>
            <div>
              <div className="text-ink">Issues</div>
              <div>{entity.issue_dates.length}</div>
            </div>
            <div>
              <div className="text-ink">Sources</div>
              <div>{entity.source_trail.length}</div>
            </div>
            <div>
              <div className="text-ink">Confidence</div>
              <div>{entity.confidence}</div>
            </div>
          </div>
        </header>

        <section className="mt-7">
          <h2 className="font-mono text-[0.6875rem] font-semibold uppercase tracking-[0.12em] text-ink">
            Newsletter story trail
          </h2>
          <ol className="mt-3 divide-y divide-line">
            {entity.story_units.map((story) => (
              <li key={story.id}>
                <Link
                  href={story.target_url}
                  className="block py-4 transition-colors hover:bg-accent-wash"
                >
                  <div className="font-mono text-[0.625rem] font-semibold uppercase tracking-[0.08em] text-primary">
                    {story.issue_date} · {story.section_id.replaceAll('-', ' ')}
                  </div>
                  <h3 className="mt-1.5 text-[1rem] font-semibold leading-snug text-ink">
                    {story.title}
                  </h3>
                  <p className="mt-2 line-clamp-3 font-serif text-[0.9375rem] leading-[1.58] text-[#30343b]">
                    {story.summary}
                  </p>
                </Link>
                {story.source_refs.length > 0 && (
                  <div className="-mt-1 mb-4 flex flex-wrap gap-x-3 gap-y-1 font-mono text-[0.625rem] text-ink-faint">
                    {story.source_refs.slice(0, 4).map((source) => (
                      <Link
                        key={`${story.id}-${source.url}`}
                        href={`/source/${encodeURIComponent(source.domain)}`}
                        className="text-primary hover:underline"
                      >
                        {source.title || source.domain}
                      </Link>
                    ))}
                  </div>
                )}
              </li>
            ))}
          </ol>
        </section>

        {entity.source_trail.length > 0 && (
          <section className="mt-8 border-t border-line pt-5">
            <h2 className="font-mono text-[0.6875rem] font-semibold uppercase tracking-[0.12em] text-ink">
              Source trail
            </h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {entity.source_trail.slice(0, 12).map((source) => (
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
        )}
      </main>
    </div>
  )
}
