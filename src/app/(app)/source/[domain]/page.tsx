import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { JsonLd } from '@/components/json-ld'
import { SourceFavicon } from '@/components/wire/source-favicon'
import { getSourceByDomain } from '@/lib/api'
import { sectionLabel, sourceLabel } from '@/lib/sections'
import { absoluteUrl, SITE_NAME } from '@/lib/site'

export const revalidate = 60

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

  const source = await getSourceByDomain(domain).catch(() => null)
  const findings = source?.findings ?? []
  const entities = source?.entities ?? []

  if (!source && findings.length === 0) notFound()

  const displayName = source?.display_name || sourceLabel(null, `https://${domain}`)
  const firstFinding = findings[0]

  return (
    <div className="h-full overflow-y-auto">
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

      <main className="mx-auto max-w-[760px] px-8 pb-24 pt-9 max-sm:px-5">
        <Link
          href="/"
          className="type-kicker text-primary hover:underline"
        >
          The Wire
        </Link>

        <header className="mt-8">
          <div className="type-kicker flex items-center gap-2 text-primary">
            <SourceFavicon url={`https://${domain}`} name={displayName} />
            Source trail
          </div>
          <h1 className="type-display mt-3 text-[2.75rem] font-[620] text-ink max-sm:text-[2rem]">
            {displayName}
          </h1>
          <p className="mt-4 max-w-[36rem] font-serif text-[1.125rem] italic leading-[1.6] text-ink-soft">
            Public MindPattern findings, entities, and graph evidence that cite this source.
          </p>

          <div className="mt-6 grid grid-cols-2 gap-x-4 gap-y-3 border-y border-line py-3 sm:grid-cols-4">
            <div>
              <div className="type-kicker text-ink-faint">Findings</div>
              <div className="mt-0.5 font-mono text-[0.75rem] text-ink">{source?.counts?.findings ?? findings.length}</div>
            </div>
            {source && (
              <>
                <div>
                  <div className="type-kicker text-ink-faint">All-time hits</div>
                  <div className="mt-0.5 font-mono text-[0.75rem] text-ink">{source.hit_count.toLocaleString()}</div>
                </div>
                <div>
                  <div className="type-kicker text-ink-faint">High value</div>
                  <div className="mt-0.5 font-mono text-[0.75rem] text-ink">{source.high_value_count.toLocaleString()}</div>
                </div>
                <div>
                  <div className="type-kicker text-ink-faint">Last seen</div>
                  <div className="mt-0.5 font-mono text-[0.75rem] text-ink">{source.last_seen}</div>
                </div>
              </>
            )}
          </div>
        </header>

        {entities.length > 0 && (
          <section className="mt-7">
            <h2 className="type-kicker text-ink">
              Connected entities
            </h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {entities.slice(0, 16).map((entity) => (
                <Link
                  key={entity.slug}
                  href={`/e/${encodeURIComponent(entity.slug)}`}
                  className="inline-block rounded-sm border border-line bg-surface px-2.5 py-1.5 font-mono text-[0.6875rem] uppercase tracking-[0.08em] text-ink transition-colors hover:bg-panel hover:text-primary"
                >
                  {entity.name}
                </Link>
              ))}
            </div>
          </section>
        )}

        <section className="mt-7">
          <h2 className="type-kicker text-ink">
            Related findings
          </h2>
          <ol className="mt-3 divide-y divide-line">
            {findings.map((finding) => (
              <li key={finding.id}>
                <Link
                  href={`/f/${finding.id}`}
                  className="block py-4 transition-colors hover:bg-spine"
                >
                  <div className="type-kicker text-primary">
                    {finding.run_date} / {sectionLabel(finding.agent)}
                  </div>
                  <h3 className="type-display mt-1.5 text-[1.125rem] font-[560] leading-snug text-ink">
                    {finding.title}
                  </h3>
                  <p className="mt-2 line-clamp-3 font-serif text-[0.9375rem] leading-[1.58] text-ink-prose">
                    {finding.summary}
                  </p>
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
            className="mt-8 inline-block rounded-sm border border-ink px-3.5 py-2 font-mono text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-ink transition-colors hover:bg-panel"
          >
            Open latest cited source
          </a>
        )}
      </main>
    </div>
  )
}
