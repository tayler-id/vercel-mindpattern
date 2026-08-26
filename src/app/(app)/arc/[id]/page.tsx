import type { Metadata } from 'next'
import { topicFor, topicStyleVars } from '@/lib/topics'
import { cache, type CSSProperties } from 'react'
import Link from 'next/link'
import { connection } from 'next/server'
import { notFound } from 'next/navigation'
import { JsonLd } from '@/components/json-ld'
import { getNarrativeArc, isBackendUnreachable } from '@/lib/api'
import type { NarrativeArc } from '@/lib/types'
import { absoluteUrl, SITE_NAME } from '@/lib/site'

export const revalidate = 3600

// Opt into on-demand ISR, matching /s, /f, /e and the briefing routes. Without
// it Next 16 ignores the revalidate export.
//
// Read the build table with that in mind: this route prints as SSG because of
// this export, but the `?date=` searchParams read below forces a per-request
// render anyway. What the export actually buys here is the cached data fetch,
// not a cached route.
export function generateStaticParams() {
  return []
}

// Both generateMetadata and the page fetch the same arc in one render pass.
// cache() makes that one call, so a timed-out head cannot be paired with a
// good body and cached as a noindex page carrying an id-derived title.
const loadArc = cache((id: string, date: string) => getNarrativeArc(id, date))

type Params = {
  params: Promise<{ id: string }>
  searchParams: Promise<{ date?: string }>
}

const ARC_ID_RE = /^[a-z0-9][a-z0-9-]{0,127}$/i
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

function cleanId(raw: string): string | null {
  // Next hands params already decoded, so /arc/%25 arrives as the literal '%'
  // and decodeURIComponent throws URIError on it. Uncaught, that is a 500
  // where the route means to answer 404.
  let decoded: string
  try {
    decoded = decodeURIComponent(raw)
  } catch {
    return null
  }
  const id = decoded.toLowerCase()
  return ARC_ID_RE.test(id) && !id.includes('..') ? id : null
}

function cleanDate(raw?: string): string | null {
  return raw && DATE_RE.test(raw) ? raw : null
}

const FALLBACK_DESCRIPTION = `A narrative arc traced across the ${SITE_NAME} public AI research archive.`

const ARC_NOT_FOUND: Metadata = {
  title: 'Arc not found',
  robots: { index: false, follow: false },
}

/** Sentence-case an id so a failed fetch still puts real words in the card. */
function titleFromId(id: string): string {
  const words = id.replace(/-+/g, ' ').trim()
  return words ? words[0].toUpperCase() + words.slice(1) : 'Narrative arc'
}

// One card shape for both the loaded arc and the backend-is-down fallback, so
// a slow box costs the headline and never the tags. Arcs have no bespoke card
// route, so they share the static site image the way /work and /explore do.
function arcCard(opts: {
  id: string
  date: string
  title: string
  description: string
  degraded?: boolean
}): Metadata {
  const { id, date, title: name, description, degraded } = opts
  const title = `${name} narrative arc`
  const canonical = `/arc/${id}?date=${date}`
  const imageAlt = `${name} · ${SITE_NAME}`
  return {
    title,
    description,
    alternates: { canonical },
    // The degraded shell answers for any id the regex allows, real or not, so
    // a crawler landing on one during an outage must not index the stub.
    ...(degraded ? { robots: { index: false, follow: true } } : {}),
    openGraph: {
      title,
      description,
      type: 'article',
      siteName: SITE_NAME,
      url: canonical,
      publishedTime: date,
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

export async function generateMetadata({ params, searchParams }: Params): Promise<Metadata> {
  const { id: raw } = await params
  const { date: rawDate } = await searchParams
  const id = cleanId(raw)
  const date = cleanDate(rawDate)
  if (!id || !date) return ARC_NOT_FOUND

  let arc: NarrativeArc | null
  try {
    arc = await loadArc(id, date)
  } catch (err) {
    // getNarrativeArc turns a backend 404 into null and rethrows the rest, so
    // only a box that did not answer gets the degraded card. Anything else is
    // a defect and belongs in the error boundary.
    if (!isBackendUnreachable(err)) throw err
    // The body marks its own degraded render dynamic; the head has to as well,
    // or a noindex stub is cached alongside a body that rendered fine.
    await connection()
    return arcCard({ id, date, title: titleFromId(id), description: FALLBACK_DESCRIPTION, degraded: true })
  }
  if (!arc) return ARC_NOT_FOUND

  return arcCard({
    id: arc.id,
    date,
    title: arc.title,
    description: (arc.summary || '').slice(0, 160) || FALLBACK_DESCRIPTION,
  })
}

/** Shown when the backend times out. A 200 with a way onward beats a 500. */
function ArcUnavailable({ id, date }: { id: string; date: string }) {
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
          {titleFromId(id)}
        </h1>
        <p className="mt-3 max-w-[56ch] font-serif text-[1.0625rem] leading-[1.5] text-ink-soft">
          The arc did not answer in time. Retry in a minute, or read the briefing it was traced from.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <a
            href={`/arc/${id}?date=${date}`}
            className="inline-block rounded-full bg-panel px-4 py-2 font-mono text-[0.65625rem] font-semibold uppercase tracking-[0.1em] text-ink hover:bg-ink hover:text-white focus-visible:outline-2 focus-visible:outline-ink focus-visible:outline-offset-2"
          >
            Retry
          </a>
          <Link
            href={`/briefings/${date}`}
            className="inline-block rounded-full bg-panel px-4 py-2 font-mono text-[0.65625rem] font-semibold uppercase tracking-[0.1em] text-ink hover:bg-ink hover:text-white focus-visible:outline-2 focus-visible:outline-ink focus-visible:outline-offset-2"
          >
            Briefing for {date}
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

export default async function ArcPage({ params, searchParams }: Params) {
  const { id: raw } = await params
  const { date: rawDate } = await searchParams
  const id = cleanId(raw)
  const date = cleanDate(rawDate)
  if (!id || !date) notFound()

  // A timeout must not become a 500. The route still answers 200 with meta tags
  // and a way onward. A backend 404 arrives as null and stays a real notFound().
  let arc: NarrativeArc | null
  try {
    arc = await loadArc(id, date)
  } catch (err) {
    if (!isBackendUnreachable(err)) throw err
    // connection() marks this render dynamic so `revalidate = 3600` cannot
    // write the degraded shell over a good page for an hour.
    await connection()
    return <ArcUnavailable id={id} date={date} />
  }
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
                      rel="noopener"
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
