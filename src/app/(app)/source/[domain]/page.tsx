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
          className="font-mono text-[0.6875rem] font-semibold uppercase tracking-[0.08em] text-primary hover:underline"
        >
          The Wire
        </Link>

        <header className="mt-8 border-b border-line pb-6">
          <div className="flex items-center gap-2 font-mono text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-primary">
            <SourceFavicon url={`https://${domain}`} name={displayName} />
            Source trail
          </div>
          <h1 className="mt-3 font-serif text-[2.25rem] font-semibold leading-[1.08] tracking-[-0.02em] text-ink max-sm:text-[1.75rem]">
            {displayName}
          </h1>
          <p className="mt-3 max-w-[36rem] font-serif text-[1rem] leading-[1.72] text-[#30343b]">
            Public MindPattern findings, entities, and graph evidence that cite this source.
          </p>

          <div className="mt-5 grid grid-cols-2 gap-3 font-mono text-[0.6875rem] text-ink-faint sm:grid-cols-4">
            <div>
              <div className="text-ink">Findings</div>
              <div>{source?.counts?.findings ?? findings.length}</div>
            </div>
            {source && (
              <>
                <div>
                  <div className="text-ink">All-time hits</div>
                  <div>{source.hit_count.toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-ink">High value</div>
                  <div>{source.high_value_count.toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-ink">Last seen</div>
                  <div>{source.last_seen}</div>
                </div>
              </>
            )}
          </div>
        </header>

        {entities.length > 0 && (
          <section className="mt-7">
            <h2 className="font-mono text-[0.6875rem] font-semibold uppercase tracking-[0.12em] text-ink">
              Connected entities
            </h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {entities.slice(0, 16).map((entity) => (
                <Link
                  key={entity.slug}
                  href={`/e/${encodeURIComponent(entity.slug)}`}
                  className="inline-block rounded-lg border border-line px-2.5 py-1.5 font-mono text-[0.71875rem] text-primary hover:border-primary hover:bg-accent-wash"
                >
                  {entity.name}
                </Link>
              ))}
            </div>
          </section>
        )}

        <section className="mt-7">
          <h2 className="font-mono text-[0.6875rem] font-semibold uppercase tracking-[0.12em] text-ink">
            Related findings
          </h2>
          <ol className="mt-3 divide-y divide-line">
            {findings.map((finding) => (
              <li key={finding.id}>
                <Link
                  href={`/f/${finding.id}`}
                  className="block py-4 transition-colors hover:bg-accent-wash"
                >
                  <div className="font-mono text-[0.625rem] font-semibold uppercase tracking-[0.08em] text-primary">
                    {finding.run_date} / {sectionLabel(finding.agent)}
                  </div>
                  <h3 className="mt-1.5 text-[1rem] font-semibold leading-snug text-ink">
                    {finding.title}
                  </h3>
                  <p className="mt-2 line-clamp-3 font-serif text-[0.9375rem] leading-[1.58] text-[#30343b]">
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
            className="mt-8 inline-block rounded-lg border border-line px-3 py-2 font-mono text-[0.71875rem] text-primary hover:border-primary hover:bg-accent-wash"
          >
            Open latest cited source
          </a>
        )}
      </main>
    </div>
  )
}
