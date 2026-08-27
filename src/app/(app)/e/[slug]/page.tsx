import type { Metadata } from 'next'
import { topicFor, topicStyleVars } from '@/lib/topics'
import { cache, type CSSProperties } from 'react'
import Link from 'next/link'
import { connection } from 'next/server'
import { notFound } from 'next/navigation'
import { JsonLd } from '@/components/json-ld'
import { getEntity, isBackendUnreachable } from '@/lib/api'
import type { PublicEntity } from '@/lib/types'
import { absoluteUrl, SITE_NAME } from '@/lib/site'

// A day-long TTL is safe here because content changes once a day and the
// nightly publish purges what it changed via POST /api/revalidate.
// changed_site_paths in orchestrator/sync.py (mindpattern-v3) lists the day's
// briefing, blog, story, source, arc, entity, and finding paths, capped at
// 200 with every dropped path logged, so fresh content does not wait out
// the TTL.
export const revalidate = 86400

// Opt into on-demand ISR — without this, Next 16 ignores the revalidate
// export and re-renders every entity click against the Fly backend.
export function generateStaticParams() {
  return []
}

type Params = { params: Promise<{ slug: string }> }

// generateMetadata and the page component are two calls in one render pass.
// Without this they each fetch, each with its own 10s budget against the same
// slow endpoint, and they can disagree: a timed-out head paired with a
// successful body writes a fully correct entity page into the ISR cache
// carrying robots {index:false} and a slug-derived title, and serves that to
// every reader and crawler for the next hour. cache() makes them one call and
// one outcome. Same bug commit 671752c fixed for the og routes.
const loadEntity = cache((slug: string) => getEntity(slug))

const ENTITY_SLUG_RE = /^[a-z0-9][a-z0-9-]{0,95}$/i

function cleanSlug(raw: string): string | null {
  // Next hands params already decoded, so a request for /e/%25 arrives as the
  // literal '%' and decodeURIComponent throws URIError on it. Uncaught, that
  // is a 500 where the route means to answer 404.
  let decoded: string
  try {
    decoded = decodeURIComponent(raw)
  } catch {
    return null
  }
  const slug = decoded.toLowerCase()
  return ENTITY_SLUG_RE.test(slug) && !slug.includes('..') ? slug : null
}

const FALLBACK_DESCRIPTION = `An entity trail from the ${SITE_NAME} public AI research archive.`

// The page answers notFound() on the same condition, so this only reaches a
// crawler that asked for the head. Marking it keeps a dead slug out of the
// index either way, matching /s/[slug] and /f/[id].
const ENTITY_NOT_FOUND: Metadata = {
  title: 'Entity not found',
  robots: { index: false, follow: false },
}

/** Sentence-case a slug so a failed fetch still puts real words in the card. */
function nameFromSlug(slug: string): string {
  const words = slug.replace(/-+/g, ' ').trim()
  return words ? words[0].toUpperCase() + words.slice(1) : 'Entity'
}

// One card shape for both the loaded entity and the backend-is-down fallback.
// /api/entities/{slug} runs graph LIKE scans over the whole finding corpus and
// measured 10.5s warm, past the 10s fetch budget, so this page threw on every
// click and the 500 carried no social tags at all. Both branches emit og:title,
// og:description, og:type, og:url, og:image with dimensions, and a large
// twitter card. Entities have no bespoke card route, so they share the static
// site image the way /work and /explore do.
function entityCard(opts: {
  slug: string
  name: string
  description: string
  degraded?: boolean
}): Metadata {
  const { slug, name, description, degraded } = opts
  const title = `${name} intelligence trail`
  const canonical = `/e/${slug}`
  const imageAlt = `${name} · ${SITE_NAME}`
  return {
    title,
    description,
    alternates: { canonical },
    // The degraded shell is reachable for any slug the regex allows, real or
    // not, so a crawler that lands on one during an outage must not index a
    // slug-titled stub. `follow` stays on so the links out still count.
    ...(degraded ? { robots: { index: false, follow: true } } : {}),
    openGraph: {
      title,
      description,
      type: 'website',
      siteName: SITE_NAME,
      url: canonical,
      images: [
        {
          url: '/opengraph-image',
          width: 1200,
          height: 630,
          type: 'image/png',
          alt: imageAlt,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [{ url: '/opengraph-image', alt: imageAlt }],
    },
  }
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
  if (!slug) return ENTITY_NOT_FOUND

  let entity: PublicEntity | null
  try {
    entity = await loadEntity(slug)
  } catch (err) {
    // getEntity turns a backend 404 into null and rethrows everything else, so
    // sort the rethrows: a box that did not answer gets the degraded card, and
    // anything else (a bug in here, a malformed payload) goes to the error
    // boundary rather than being reported to readers as a slow minute.
    if (!isBackendUnreachable(err)) throw err
    // The body marks its own degraded render dynamic. The head has to as well,
    // or a noindex stub gets written into the full route cache alongside a
    // body that rendered fine.
    await connection()
    return entityCard({
      slug,
      name: nameFromSlug(slug),
      description: FALLBACK_DESCRIPTION,
      degraded: true,
    })
  }
  if (!entity) return ENTITY_NOT_FOUND

  return entityCard({
    slug: entity.slug,
    name: entity.name,
    description: `MindPattern newsletter stories, sources, and graph evidence connected to ${entity.name}.`,
  })
}

/** Shown when the backend times out. A 200 with a way onward beats a 500. */
function EntityUnavailable({ slug }: { slug: string }) {
  return (
    <div className="h-full overflow-y-auto">
      <main className="mx-auto max-w-[720px] px-8 pb-24 pt-10 max-sm:px-5 max-sm:pt-6">
        <Link
          href="/"
          className="type-kicker inline-block text-ink-soft transition-colors duration-[var(--dur-fast)] hover:text-ink focus-visible:outline-2 focus-visible:outline-ink focus-visible:outline-offset-2"
        >
          ← The Wire
        </Link>
        <p className="type-kicker mt-6 text-primary">Wire interrupted</p>
        <h1
          className="type-display mt-2 text-[clamp(1.75rem,4vw,2.5rem)] leading-[1.05] tracking-[-0.02em] text-ink"
          style={{ fontVariationSettings: '"wdth" 114', fontWeight: 850 } as CSSProperties}
        >
          {nameFromSlug(slug)}
        </h1>
        <p className="mt-3 max-w-[56ch] font-serif text-[1.0625rem] leading-[1.5] text-ink-soft">
          The entity trail did not answer in time. Retry in a minute, or start from the briefing archive.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <a
            href={`/e/${slug}`}
            className="inline-block rounded-full bg-panel px-4 py-2 font-mono text-[0.65625rem] font-semibold uppercase tracking-[0.1em] text-ink hover:bg-ink hover:text-white focus-visible:outline-2 focus-visible:outline-ink focus-visible:outline-offset-2"
          >
            Retry
          </a>
          <Link
            href="/briefings"
            className="inline-block rounded-full bg-panel px-4 py-2 font-mono text-[0.65625rem] font-semibold uppercase tracking-[0.1em] text-ink hover:bg-ink hover:text-white focus-visible:outline-2 focus-visible:outline-ink focus-visible:outline-offset-2"
          >
            Briefing archive
          </Link>
          <Link
            href="/explore"
            className="inline-block rounded-full bg-panel px-4 py-2 font-mono text-[0.65625rem] font-semibold uppercase tracking-[0.1em] text-ink hover:bg-ink hover:text-white focus-visible:outline-2 focus-visible:outline-ink focus-visible:outline-offset-2"
          >
            Explore
          </Link>
        </div>
      </main>
    </div>
  )
}

export default async function EntityPage({ params }: Params) {
  const { slug: raw } = await params
  const slug = cleanSlug(raw)
  if (!slug) notFound()

  // A timeout must not become a 500. The route still answers 200 with meta tags
  // and a way onward. A backend 404 arrives as null and stays a real notFound().
  let entity: PublicEntity | null
  try {
    entity = await loadEntity(slug)
  } catch (err) {
    if (!isBackendUnreachable(err)) throw err
    // `revalidate = 86400` means a successful render is written to the full
    // route cache and served to everyone for the next day. Without this the
    // shell would replace a good entity page for a day every time the 7 AM
    // slow window happened to catch a revalidation. connection() marks the
    // render dynamic, so this one is never stored.
    await connection()
    return <EntityUnavailable slug={slug} />
  }
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
