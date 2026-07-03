import type { Metadata } from 'next'
import { topicFor, topicStyleVars } from '@/lib/topics'
import type { CSSProperties } from 'react'
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
    <div className="h-full overflow-y-auto" style={topicStyleVars(topicFor(entity.slug)) as CSSProperties}>
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

      <main className="mx-auto max-w-[720px] px-8 pb-24 pt-9 max-sm:px-5">
        <Link href="/" className="rise-in type-kicker inline-block text-ink-soft transition-colors hover:text-ink" style={{ '--i': 0 } as CSSProperties}>
          ← The Wire
        </Link>

        <header className="mt-8">
          <div className="rise-in type-kicker text-[color:var(--tc-text)]" style={{ '--i': 1 } as CSSProperties}>
            Entity trail
          </div>
          <h1
            className="rise-in type-display mt-2 text-[clamp(2.25rem,5vw,3.5rem)] uppercase leading-[0.98] tracking-[-0.02em] text-ink"
            style={{ '--i': 2, fontVariationSettings: '"wdth" 114', fontWeight: 850 } as CSSProperties}
          >
            {entity.name}
          </h1>
          <p className="rise-in mt-2 max-w-[52ch] font-serif text-[1.125rem] leading-[1.55] text-ink-soft" style={{ '--i': 3 } as CSSProperties}>
            Source-backed findings, relationship evidence, citations, and briefing history from the public MindPattern archive.
          </p>

          <div className="rise-in mt-8 flex flex-wrap gap-x-9 gap-y-3 border-t-[3px] border-ink py-3" style={{ '--i': 4 } as CSSProperties}>
            <div>
              <div className="type-kicker text-ink-faint">Briefing refs</div>
              <div className="mt-0.5 font-mono text-[0.75rem] font-semibold text-ink">{briefingCount}</div>
            </div>
            <div>
              <div className="type-kicker text-ink-faint">Findings</div>
              <div className="mt-0.5 font-mono text-[0.75rem] font-semibold text-ink">{findingCount}</div>
            </div>
            <div>
              <div className="type-kicker text-ink-faint">Edges</div>
              <div className="mt-0.5 font-mono text-[0.75rem] font-semibold text-ink">{relationshipCount}</div>
            </div>
            <div>
              <div className="type-kicker text-ink-faint">Sources</div>
              <div className="mt-0.5 font-mono text-[0.75rem] font-semibold text-ink">{sourceCount}</div>
            </div>
          </div>
          {entity.pagination?.has_more && (
            <p className="mt-3 font-mono text-[0.6875rem] text-ink-faint">
              Showing the first {entity.pagination.limit} findings. More graph evidence exists in the corpus.
            </p>
          )}
        </header>

        {dossier && (
          <section className="scroll-rise mt-10">
            <h2 className="type-display text-[25px] uppercase leading-[1.04] text-ink">Dossier</h2>
            <p className="type-kicker mt-1 text-ink-faint">
              Compiled {dossier.date} · {dossier.confidence}
            </p>
            {dossier.take && (
              <aside className="mt-4 rounded-[20px] p-7 max-sm:px-5" style={{ background: 'var(--tc)' }}>
                <span className="type-kicker inline-block rounded-full bg-paper px-4 py-1 text-[color:var(--tc-text)]">
                  The take
                </span>
                <p
                  className="mt-3 text-[1.1875rem] leading-[1.3]"
                  style={{ color: 'var(--tc-on)', fontVariationSettings: '"wdth" 106', fontWeight: 680 }}
                >
                  {dossier.take}
                </p>
              </aside>
            )}
            {dossier.timeline.length > 0 && (
              <ol className="mt-4">
                {dossier.timeline.slice(0, 10).map((entry) => (
                  <li key={entry.date} className="rule-row px-1 py-3">
                    <div className="type-kicker text-[color:var(--tc-text)]">{entry.date}</div>
                    <ul className="mt-2 space-y-1">
                      {entry.items.slice(0, 3).map((item) => (
                        <li key={item.finding_id}>
                          <Link
                            href={item.target_url}
                            className="font-serif text-[1rem] leading-snug text-ink hover:underline"
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
              <div className="mt-4 flex flex-wrap gap-3">
                {dossier.top_sources.slice(0, 8).map((source) => (
                  <Link
                    key={source.domain}
                    href={source.target_url}
                    className="inline-block rounded-full bg-panel px-4 py-2 font-mono text-[0.65625rem] font-semibold uppercase tracking-[0.1em] text-ink transition-all duration-[var(--dur-fast)] ease-[var(--ease-swift)] hover:-translate-y-0.5 hover:bg-ink hover:text-white focus-visible:outline-2 focus-visible:outline-ink focus-visible:outline-offset-2"
                  >
                    {source.domain} · {source.finding_count}
                  </Link>
                ))}
              </div>
            )}
          </section>
        )}

        {findings.length > 0 && (
          <section className="scroll-rise mt-10">
            <h2 className="type-display text-[25px] uppercase leading-[1.04] text-ink">Corpus findings</h2>
            <ol className="mt-3">
              {findings.slice(0, 12).map((finding) => (
                <li key={finding.id} className="flood-row rule-row group">
                  <Link
                    href={finding.target_url || `/f/${finding.id}`}
                    className="grid grid-cols-[1fr_auto] gap-4 px-4 py-4"
                  >
                    <span className="block min-w-0">
                      <span className="type-kicker block text-[color:var(--tc-text)]">
                        {finding.run_date} / {finding.relationship || finding.agent}
                      </span>
                      <span className="type-display mt-2 block text-[1.1875rem] leading-[1.1] text-ink">
                        {finding.title}
                      </span>
                      <span className="mt-2 line-clamp-2 block font-serif text-[0.9375rem] leading-[1.58] text-ink-prose">
                        {finding.summary}
                      </span>
                    </span>
                    <span
                      aria-hidden
                      className="h-3 w-3 shrink-0 self-center rounded-full bg-[var(--tc)] transition-colors group-hover:bg-[var(--tc-on)] group-focus-within:bg-[var(--tc-on)]"
                    />
                  </Link>
                </li>
              ))}
            </ol>
          </section>
        )}

        {relationships.length > 0 && (
          <section className="scroll-rise mt-10 border-t-[3px] border-ink pt-4">
            <h2 className="type-display text-[25px] uppercase leading-[1.04] text-ink">Graph relationships</h2>
            <ol className="mt-3">
              {relationships.slice(0, 12).map((relationship, index) => (
                <li key={`${relationship.source}-${relationship.relationship}-${index}`} className="rule-row px-1 py-3">
                  <div className="type-kicker text-[color:var(--tc-text)]">
                    {relationshipLabel(relationship.source, relationship.relationship)}
                  </div>
                  <div className="mt-2 font-serif text-[1rem] leading-snug text-ink">
                    {relationship.related_entity && relationship.related_entity_slug !== 'unknown' ? (
                      <Link
                        href={`/e/${encodeURIComponent(relationship.related_entity_slug || '')}`}
                        className="underline decoration-[var(--tc)] decoration-2 underline-offset-[3px] hover:text-[color:var(--tc-text)]"
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
                    <p className="mt-2 font-serif text-[0.9375rem] leading-[1.58] text-ink-prose">
                      {relationship.fact_text}
                    </p>
                  )}
                  {relationship.target_url && (
                    <Link
                      href={relationship.target_url}
                      className="type-kicker mt-2 inline-block text-[color:var(--tc-text)] hover:underline"
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
          <section className="scroll-rise mt-10 border-t-[3px] border-ink pt-4">
            <h2 className="type-display text-[25px] uppercase leading-[1.04] text-ink">Source trail</h2>
            <div className="mt-3 flex flex-wrap gap-3">
              {sourceTrail.slice(0, 12).map((source) => (
                <Link
                  key={source.url}
                  href={`/source/${encodeURIComponent(source.domain)}`}
                  className="inline-block rounded-full bg-panel px-4 py-2 font-mono text-[0.65625rem] font-semibold uppercase tracking-[0.1em] text-ink transition-all duration-[var(--dur-fast)] ease-[var(--ease-swift)] hover:-translate-y-0.5 hover:bg-ink hover:text-white focus-visible:outline-2 focus-visible:outline-ink focus-visible:outline-offset-2"
                >
                  {source.title || source.domain}
                </Link>
              ))}
            </div>
          </section>
        )}

        {graphSources.length > 0 && (
          <section className="scroll-rise mt-10 border-t-[3px] border-ink pt-4">
            <h2 className="type-display text-[25px] uppercase leading-[1.04] text-ink">Graph sources</h2>
            <div className="mt-3 flex flex-wrap gap-3">
              {graphSources.map((source) => (
                <span
                  key={source}
                  className="inline-block rounded-full bg-panel px-4 py-2 font-mono text-[0.65625rem] font-semibold uppercase tracking-[0.1em] text-ink-soft"
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
