import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { JsonLd } from '@/components/json-ld'
import { getNarrativeArc } from '@/lib/api'
import { absoluteUrl, SITE_NAME } from '@/lib/site'

export const revalidate = 60

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
    <div className="h-full overflow-y-auto">
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

      <main className="mx-auto max-w-[760px] px-8 pb-24 pt-9 max-sm:px-5">
        <Link
          href="/"
          className="type-kicker text-primary hover:underline"
        >
          The Wire
        </Link>

        <header className="mt-8">
          <div className="type-kicker text-primary">
            Narrative arc
          </div>
          <h1 className="type-display mt-3 text-[2.75rem] font-[620] text-ink max-sm:text-[2rem]">
            {arc.title}
          </h1>
          <p className="mt-4 font-serif text-[1.1875rem] italic leading-[1.6] text-ink-soft">
            {arc.summary}
          </p>

          <div className="mt-6 grid grid-cols-2 gap-x-4 gap-y-3 border-y border-line py-3 sm:grid-cols-4">
            <div>
              <div className="type-kicker text-ink-faint">Status</div>
              <div className="mt-0.5 font-mono text-[0.75rem] text-ink">{arc.status}</div>
            </div>
            <div>
              <div className="type-kicker text-ink-faint">Evidence</div>
              <div className="mt-0.5 font-mono text-[0.75rem] text-ink">{arc.evidence_count}</div>
            </div>
            <div>
              <div className="type-kicker text-ink-faint">Dates</div>
              <div className="mt-0.5 font-mono text-[0.75rem] text-ink">{arc.date_count}</div>
            </div>
            <div>
              <div className="type-kicker text-ink-faint">Sources</div>
              <div className="mt-0.5 font-mono text-[0.75rem] text-ink">{arc.source_domain_count}</div>
            </div>
          </div>
        </header>

        <section className="mt-7">
          <h2 className="type-kicker text-ink">
            Evidence trail
          </h2>
          <ol className="mt-3 divide-y divide-line">
            {arc.evidence.map((item, index) => (
              <li key={`${item.finding_id ?? index}-${item.source_url}`} className="py-4">
                <div className="type-kicker text-primary">
                  {item.run_date} / {item.source_name || item.agent}
                </div>
                {item.finding_id != null ? (
                  <Link
                    href={`/f/${item.finding_id}`}
                    className="type-display mt-1.5 block text-[1.125rem] font-[560] leading-snug text-ink hover:underline"
                  >
                    {item.title}
                  </Link>
                ) : (
                  <h3 className="type-display mt-1.5 text-[1.125rem] font-[560] leading-snug text-ink">{item.title}</h3>
                )}
                <p className="mt-2 font-serif text-[0.9375rem] leading-[1.58] text-ink-prose">
                  {item.summary}
                </p>
                {item.source_url && (
                  <a
                    href={item.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="type-kicker mt-2 inline-block text-primary hover:underline"
                  >
                    Source
                  </a>
                )}
              </li>
            ))}
          </ol>
        </section>
      </main>
    </div>
  )
}
