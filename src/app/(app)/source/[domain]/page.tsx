import type { Metadata } from 'next'
import { topicFor, topicStyleVars } from '@/lib/topics'
import type { CSSProperties } from 'react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { JsonLd } from '@/components/json-ld'
import { SourceFavicon } from '@/components/wire/source-favicon'
import { getSourceByDomain } from '@/lib/api'
import { sectionLabel, sourceLabel } from '@/lib/sections'
import { absoluteUrl, SITE_NAME } from '@/lib/site'

export const revalidate = 3600

// Opt into on-demand ISR — without this, Next 16 ignores the revalidate
// export and re-renders every source click against the Fly backend.
export function generateStaticParams() {
  return []
}

type Params = { params: Promise<{ domain: string }> }

const DOMAIN_RE = /^[a-z0-9.-]+\.[a-z]{2,}$/i

function cleanDomain(raw: string): string | null {
  const domain = decodeURIComponent(raw).toLowerCase().replace(/^www\./, '')
  return DOMAIN_RE.test(domain) && !domain.includes('..') ? domain : null
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { domain: raw } = await params
  const domain = cleanDomain(raw)
  if (!domain) return { title: 'Source not found' }
  return {
    title: `${domain} source trail`,
    description: `MindPattern findings and briefing signals sourced from ${domain}.`,
    alternates: { canonical: `/source/${domain}` },
  }
}

export default async function SourcePage({ params }: Params) {
  const { domain: raw } = await params
  const domain = cleanDomain(raw)
  if (!domain) notFound()

  // Transient backend failures throw to error.tsx; only a genuine miss (404
  // plus no match in the source list) may become a cacheable notFound().
  const source = await getSourceByDomain(domain)
  const findings = source?.findings ?? []
  const entities = source?.entities ?? []

  if (!source && findings.length === 0) notFound()

  const displayName = source?.display_name || sourceLabel(null, `https://${domain}`)
  const firstFinding = findings[0]

  return (
    <div className="h-full overflow-y-auto" style={topicStyleVars(topicFor(domain)) as CSSProperties}>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'WebPage',
          '@id': absoluteUrl(`/source/${domain}#source`),
          name: `${displayName} source trail`,
          url: absoluteUrl(`/source/${domain}`),
          isPartOf: {
            '@type': 'WebSite',
            name: SITE_NAME,
            url: absoluteUrl('/'),
          },
          about: {
            '@type': 'Organization',
            name: displayName,
            url: `https://${domain}`,
          },
        }}
      />

      <main className="mx-auto max-w-[720px] px-8 pb-24 pt-9 max-sm:px-5">
        <Link
          href="/"
          className="rise-in type-kicker inline-block text-ink-soft transition-colors duration-[var(--dur-fast)] hover:text-ink focus-visible:outline-2 focus-visible:outline-ink focus-visible:outline-offset-2"
          style={{ '--i': 0 } as CSSProperties}
        >
          ← The Wire
        </Link>

        <header className="mt-8">
          <div className="rise-in type-kicker flex items-center gap-2 text-[color:var(--tc-text)]" style={{ '--i': 1 } as CSSProperties}>
            <SourceFavicon url={`https://${domain}`} name={displayName} />
            Source trail
          </div>
          <h1
            className="rise-in type-display mt-2 text-[clamp(2.25rem,5vw,3.5rem)] uppercase leading-[0.98] tracking-[-0.02em] text-ink"
            style={{ '--i': 2, fontVariationSettings: '"wdth" 114', fontWeight: 850 } as CSSProperties}
          >
            {displayName}
          </h1>
          <p className="rise-in mt-2 max-w-[52ch] font-serif text-[1.125rem] leading-[1.55] text-ink-soft" style={{ '--i': 3 } as CSSProperties}>
            Public MindPattern findings, entities, and graph evidence that cite this source.
          </p>

          <div className="rise-in mt-8 flex flex-wrap gap-x-9 gap-y-3 border-t-[3px] border-ink py-3" style={{ '--i': 4 } as CSSProperties}>
            <div>
              <div className="type-kicker text-ink-faint">Findings</div>
              <div className="mt-0.5 font-mono text-[0.75rem] font-semibold text-ink">{source?.counts?.findings ?? findings.length}</div>
            </div>
            {source && (
              <>
                <div>
                  <div className="type-kicker text-ink-faint">All-time hits</div>
                  <div className="mt-0.5 font-mono text-[0.75rem] font-semibold text-ink">{source.hit_count.toLocaleString()}</div>
                </div>
                <div>
                  <div className="type-kicker text-ink-faint">High value</div>
                  <div className="mt-0.5 font-mono text-[0.75rem] font-semibold text-ink">{source.high_value_count.toLocaleString()}</div>
                </div>
                <div>
                  <div className="type-kicker text-ink-faint">Last seen</div>
                  <div className="mt-0.5 font-mono text-[0.75rem] font-semibold text-ink">{source.last_seen}</div>
                </div>
              </>
            )}
          </div>
        </header>

        {entities.length > 0 && (
          <section className="scroll-rise mt-10">
            <h2 className="type-display text-[25px] uppercase leading-[1.04] text-ink">Connected entities</h2>
            <div className="mt-3 flex flex-wrap gap-3">
              {entities.slice(0, 16).map((entity) => (
                <Link
                  key={entity.slug}
                  href={`/e/${encodeURIComponent(entity.slug)}`}
                  className="inline-block rounded-full bg-panel px-4 py-2 font-mono text-[0.65625rem] font-semibold uppercase tracking-[0.1em] text-ink transition-all duration-[var(--dur-fast)] ease-[var(--ease-swift)] hover:-translate-y-0.5 hover:bg-ink hover:text-white focus-visible:outline-2 focus-visible:outline-ink focus-visible:outline-offset-2"
                >
                  {entity.name}
                </Link>
              ))}
            </div>
          </section>
        )}

        <section className="scroll-rise mt-10">
          <h2 className="type-display text-[25px] uppercase leading-[1.04] text-ink">Related findings</h2>
          <ol className="mt-3">
            {findings.map((finding) => (
              <li key={finding.id} className="flood-row rule-row group">
                <Link href={`/f/${finding.id}`} className="grid grid-cols-[1fr_auto] gap-4 px-4 py-4">
                  <span className="block min-w-0">
                    <span className="type-kicker block text-[color:var(--tc-text)]">
                      {finding.run_date} / {sectionLabel(finding.agent)}
                    </span>
                    <span className="type-display mt-2 block text-[1.1875rem] leading-[1.1] text-ink">
                      {finding.title}
                    </span>
                    <span className="mt-2 line-clamp-3 block font-serif text-[0.9375rem] leading-[1.58] text-ink-prose">
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

        {firstFinding?.source_url && (
          <a
            href={firstFinding.source_url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-10 inline-flex min-h-[44px] items-center rounded-full bg-ink px-6 py-3 font-mono text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-white transition-all duration-[var(--dur-fast)] ease-[var(--ease-swift)] hover:-translate-y-0.5 hover:bg-primary active:scale-95 focus-visible:outline-2 focus-visible:outline-ink focus-visible:outline-offset-2"
          >
            Open latest cited source
          </a>
        )}
      </main>
    </div>
  )
}
