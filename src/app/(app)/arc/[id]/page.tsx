import type { Metadata } from 'next'
import { topicFor, topicStyleVars } from '@/lib/topics'
import type { CSSProperties } from 'react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { JsonLd } from '@/components/json-ld'
import { getNarrativeArc } from '@/lib/api'
import { absoluteUrl, SITE_NAME } from '@/lib/site'

export const revalidate = 3600

type Params = {
  params: Promise<{ id: string }>
  searchParams: Promise<{ date?: string }>
}

const ARC_ID_RE = /^[a-z0-9][a-z0-9-]{0,127}$/i
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

function cleanId(raw: string): string | null {
  const id = decodeURIComponent(raw).toLowerCase()
  return ARC_ID_RE.test(id) && !id.includes('..') ? id : null
}

function cleanDate(raw?: string): string | null {
  return raw && DATE_RE.test(raw) ? raw : null
}

export async function generateMetadata({ params, searchParams }: Params): Promise<Metadata> {
  const { id: raw } = await params
  const { date: rawDate } = await searchParams
  const id = cleanId(raw)
  const date = cleanDate(rawDate)
  if (!id || !date) return { title: 'Arc not found' }
  const arc = await getNarrativeArc(id, date)
  if (!arc) return { title: 'Arc not found' }
  return {
    title: `${arc.title} narrative arc`,
    description: arc.summary.slice(0, 160),
    alternates: { canonical: `/arc/${arc.id}?date=${date}` },
  }
}

export default async function ArcPage({ params, searchParams }: Params) {
  const { id: raw } = await params
  const { date: rawDate } = await searchParams
  const id = cleanId(raw)
  const date = cleanDate(rawDate)
  if (!id || !date) notFound()

  const arc = await getNarrativeArc(id, date)
  if (!arc) notFound()

  return (
    <div className="h-full overflow-y-auto" style={topicStyleVars(topicFor(arc.id)) as CSSProperties}>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'WebPage',
          '@id': absoluteUrl(`/arc/${arc.id}?date=${date}#arc`),
          name: `${arc.title} narrative arc`,
          description: arc.summary,
          url: absoluteUrl(`/arc/${arc.id}?date=${date}`),
          isPartOf: {
            '@type': 'WebSite',
            name: SITE_NAME,
            url: absoluteUrl('/'),
          },
          citation: arc.evidence.map((item) => item.source_url).filter(Boolean),
        }}
      />

      <main className="mx-auto max-w-[720px] px-8 pb-24 pt-9 max-sm:px-5">
        <Link href="/" className="rise-in type-kicker inline-block text-ink-soft transition-colors hover:text-ink" style={{ '--i': 0 } as CSSProperties}>
          ← The Wire
        </Link>

        <header className="mt-8">
          <div className="rise-in type-kicker text-[color:var(--tc-text)]" style={{ '--i': 1 } as CSSProperties}>
            Narrative arc
          </div>
          <h1
            className="rise-in type-display mt-2 text-[clamp(2.25rem,5vw,3.5rem)] uppercase leading-[0.98] tracking-[-0.02em] text-ink"
            style={{ '--i': 2, fontVariationSettings: '"wdth" 114', fontWeight: 850 } as CSSProperties}
          >
            {arc.title}
          </h1>
          <p className="rise-in mt-2 max-w-[56ch] font-serif text-[1.1875rem] leading-[1.5] text-ink-soft" style={{ '--i': 3 } as CSSProperties}>
            {arc.summary}
          </p>

          <div className="rise-in mt-8 flex flex-wrap gap-x-9 gap-y-3 border-t-[3px] border-ink py-3" style={{ '--i': 4 } as CSSProperties}>
            <div>
              <div className="type-kicker text-ink-faint">Status</div>
              <div className="mt-0.5 font-mono text-[0.75rem] font-semibold uppercase text-ink">{arc.status}</div>
            </div>
            <div>
              <div className="type-kicker text-ink-faint">Evidence</div>
              <div className="mt-0.5 font-mono text-[0.75rem] font-semibold text-ink">{arc.evidence_count}</div>
            </div>
            <div>
              <div className="type-kicker text-ink-faint">Dates</div>
              <div className="mt-0.5 font-mono text-[0.75rem] font-semibold text-ink">{arc.date_count}</div>
            </div>
            <div>
              <div className="type-kicker text-ink-faint">Sources</div>
              <div className="mt-0.5 font-mono text-[0.75rem] font-semibold text-ink">{arc.source_domain_count}</div>
            </div>
          </div>
        </header>

        <section className="mt-10">
          <h2 className="type-display text-[25px] uppercase leading-[1.04] text-ink">Evidence trail</h2>
          <ol className="mt-3">
            {arc.evidence.map((item, index) => (
              <li
                key={`${item.finding_id ?? index}-${item.source_url}`}
                className={`${index < 8 ? 'rise-in' : 'scroll-rise'} flood-row rule-row group grid grid-cols-[1fr_auto] gap-4 px-4 py-4`}
                style={{ ...topicStyleVars(topicFor(item.agent || arc.id)), '--i': index + 5 } as CSSProperties}
              >
                <div className="min-w-0">
                  <div className="type-kicker text-[color:var(--tc-text)]">
                    {item.run_date} / {item.source_name || item.agent}
                  </div>
                  {item.finding_id != null ? (
                    <Link
                      href={`/f/${item.finding_id}`}
                      className="type-display mt-2 block text-[1.1875rem] leading-[1.1] text-ink"
                    >
                      {item.title}
                    </Link>
                  ) : (
                    <h3 className="type-display mt-2 text-[1.1875rem] leading-[1.1] text-ink">{item.title}</h3>
                  )}
                  <p className="mt-2 font-serif text-[0.9375rem] leading-[1.58] text-ink-prose">
                    {item.summary}
                  </p>
                  {item.source_url && (
                    <a
                      href={item.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="type-kicker mt-2 inline-block text-[color:var(--tc-text)] hover:underline"
                    >
                      Source
                    </a>
                  )}
                </div>
                <span
                  aria-hidden
                  className="h-3 w-3 shrink-0 self-center rounded-full bg-[var(--tc)] transition-colors group-hover:bg-[var(--tc-on)] group-focus-within:bg-[var(--tc-on)]"
                />
              </li>
            ))}
          </ol>
        </section>
      </main>
    </div>
  )
}
