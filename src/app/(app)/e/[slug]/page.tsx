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

function relationshipLabel(source: string, relationship: string): string {
  const rel = relationship.replaceAll('_', ' ').trim()
  const map: Record<string, string> = {
    entity_graph_provenance: 'Graph evidence',
    findings_text: 'Corpus mention',
    reported_on: 'Reported in',
    powers: 'Powers',
  }
  return map[relationship] || map[source] || rel || 'Graph evidence'
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
  const dossier = entity.dossier ?? null
  const findings = entity.findings ?? []
  const relationships = entity.relationships ?? []
  const sourceTrail = entity.source_trail ?? []
  const graphSources = entity.graph_sources ?? []
  const briefingCount = entity.counts?.story_units ?? entity.issue_dates?.length ?? 0
  const findingCount = entity.counts?.findings ?? findings.length
  const relationshipCount = entity.counts?.relationships ?? relationships.length
  const sourceCount = entity.counts?.sources ?? sourceTrail.length

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
          citation: sourceTrail.slice(0, 12).map((source) => source.url),
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
            Entity trail
          </div>
          <h1 className="mt-3 font-serif text-[2.25rem] font-semibold leading-[1.08] text-ink max-sm:text-[1.75rem]">
            {entity.name}
          </h1>
          <p className="mt-3 max-w-[38rem] font-serif text-[1rem] leading-[1.72] text-[#30343b]">
            Source-backed findings, relationship evidence, citations, and briefing history from the public MindPattern archive.
          </p>

          <div className="mt-5 grid grid-cols-2 gap-3 font-mono text-[0.6875rem] text-ink-faint sm:grid-cols-4">
            <div>
              <div className="text-ink">Briefing refs</div>
              <div>{briefingCount}</div>
            </div>
            <div>
              <div className="text-ink">Findings</div>
              <div>{findingCount}</div>
            </div>
            <div>
              <div className="text-ink">Edges</div>
              <div>{relationshipCount}</div>
            </div>
            <div>
              <div className="text-ink">Sources</div>
              <div>{sourceCount}</div>
            </div>
          </div>
          {entity.pagination?.has_more && (
            <p className="mt-3 font-mono text-[0.6875rem] text-ink-faint">
              Showing the first {entity.pagination.limit} findings. More graph evidence exists in the corpus.
            </p>
          )}
        </header>

        {dossier && (
          <section className="mt-7">
            <h2 className="font-mono text-[0.6875rem] font-semibold uppercase text-ink">
              Dossier
            </h2>
            <p className="mt-1 font-mono text-[0.6875rem] text-ink-faint">
              Compiled by the content machine on {dossier.date} · {dossier.confidence}
            </p>
            {dossier.take && (
              <div className="mt-3 rounded border border-primary/25 bg-primary/[0.04] px-4 py-3">
                <div className="font-mono text-[0.625rem] font-semibold uppercase tracking-wider text-primary">
                  The take
                </div>
                <p className="mt-1.5 font-serif text-[1rem] leading-[1.68] text-ink">
                  {dossier.take}
                </p>
              </div>
            )}
            {dossier.timeline.length > 0 && (
              <ol className="mt-3 divide-y divide-line">
                {dossier.timeline.slice(0, 10).map((entry) => (
                  <li key={entry.date} className="py-3">
                    <div className="font-mono text-[0.625rem] font-semibold uppercase text-primary">
                      {entry.date}
                    </div>
                    <ul className="mt-1.5 space-y-1">
                      {entry.items.slice(0, 3).map((item) => (
                        <li key={item.finding_id}>
                          <Link
                            href={item.target_url}
                            className="text-[0.9375rem] leading-snug text-ink hover:text-primary"
                          >
                            {item.title}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </li>
                ))}
              </ol>
            )}
            {dossier.top_sources.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {dossier.top_sources.slice(0, 8).map((source) => (
                  <Link
                    key={source.domain}
                    href={source.target_url}
                    className="rounded border border-line px-2 py-1 font-mono text-[0.6875rem] text-ink-faint hover:border-primary hover:text-primary"
                  >
                    {source.domain} · {source.finding_count}
                  </Link>
                ))}
              </div>
            )}
          </section>
        )}

        {findings.length > 0 && (
          <section className="mt-7">
            <h2 className="font-mono text-[0.6875rem] font-semibold uppercase text-ink">
              Corpus findings
            </h2>
            <ol className="mt-3 divide-y divide-line">
              {findings.slice(0, 12).map((finding) => (
                <li key={finding.id}>
                  <Link
                    href={finding.target_url || `/f/${finding.id}`}
                    className="block py-4 transition-colors hover:bg-accent-wash"
                  >
                    <div className="font-mono text-[0.625rem] font-semibold uppercase text-primary">
                      {finding.run_date} / {finding.relationship || finding.agent}
                    </div>
                    <h3 className="mt-1.5 text-[1rem] font-semibold leading-snug text-ink">
                      {finding.title}
                    </h3>
                    <p className="mt-2 line-clamp-2 font-serif text-[0.9375rem] leading-[1.58] text-[#30343b]">
                      {finding.summary}
                    </p>
                  </Link>
                </li>
              ))}
            </ol>
          </section>
        )}

        {relationships.length > 0 && (
          <section className="mt-8 border-t border-line pt-5">
            <h2 className="font-mono text-[0.6875rem] font-semibold uppercase text-ink">
              Graph relationships
            </h2>
            <ol className="mt-3 divide-y divide-line">
              {relationships.slice(0, 12).map((relationship, index) => (
                <li key={`${relationship.source}-${relationship.relationship}-${index}`} className="py-3">
                  <div className="font-mono text-[0.625rem] font-semibold uppercase text-primary">
                    {relationshipLabel(relationship.source, relationship.relationship)}
                  </div>
                  <div className="mt-1.5 text-[0.9375rem] leading-snug text-ink">
                    {relationship.related_entity && relationship.related_entity_slug !== 'unknown' ? (
                      <Link
                        href={`/e/${encodeURIComponent(relationship.related_entity_slug || '')}`}
                        className="text-primary hover:underline"
                      >
                        {relationship.related_entity}
                      </Link>
                    ) : relationship.related_entity ? (
                      <span>{relationship.related_entity}</span>
                    ) : (
                      <span>
                        {relationship.entity_a} {'->'} {relationship.entity_b}
                      </span>
                    )}
                  </div>
                  {relationship.fact_text && (
                    <p className="mt-2 font-serif text-[0.9375rem] leading-[1.58] text-[#30343b]">
                      {relationship.fact_text}
                    </p>
                  )}
                  {relationship.target_url && (
                    <Link
                      href={relationship.target_url}
                      className="mt-2 inline-block font-mono text-[0.625rem] text-primary hover:underline"
                    >
                      Source finding
                    </Link>
                  )}
                </li>
              ))}
            </ol>
          </section>
        )}

        {sourceTrail.length > 0 && (
          <section className="mt-8 border-t border-line pt-5">
            <h2 className="font-mono text-[0.6875rem] font-semibold uppercase text-ink">
              Source trail
            </h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {sourceTrail.slice(0, 12).map((source) => (
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

        {graphSources.length > 0 && (
          <section className="mt-8 border-t border-line pt-5">
            <h2 className="font-mono text-[0.6875rem] font-semibold uppercase text-ink">
              Graph sources
            </h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {graphSources.map((source) => (
                <span
                  key={source}
                  className="inline-block rounded-lg border border-line px-2.5 py-1.5 font-mono text-[0.71875rem] text-ink-faint"
                >
                  {source.replaceAll('_', ' ')}
                </span>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  )
}
