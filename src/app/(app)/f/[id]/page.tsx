import type { Metadata } from 'next'
import type { CSSProperties } from 'react'
import Link from 'next/link'
import { connection } from 'next/server'
import { notFound } from 'next/navigation'
import { emptyRelated, getFinding, getRelated, isBackendUnreachable } from '@/lib/api'
import type { Finding } from '@/lib/types'
import { RabbitHole } from '@/components/story/rabbit-hole'
import { SITE_NAME } from '@/lib/site'

// A day-long TTL is safe here because content changes once a day and the
// nightly publish purges what it changed via POST /api/revalidate.
// changed_site_paths in orchestrator/sync.py (mindpattern-v3) lists the day's
// briefing, blog, story, source, arc, entity, and finding paths, capped at
// 200 with every dropped path logged, so fresh content does not wait out
// the TTL.
export const revalidate = 86400

// Opt into on-demand ISR — without this, Next 16 ignores the revalidate
// export and re-renders every finding click against the Fly backend.
export function generateStaticParams() {
  return []
}

type Params = { params: Promise<{ id: string }> }

const FALLBACK_DESCRIPTION = `A source-backed finding from the ${SITE_NAME} autonomous AI research pipeline.`

/** Findings are addressed by row id, so a non-numeric segment is a bad URL
    rather than a slow backend, and never worth a fetch. */
function parseFindingId(raw: string): number | null {
  if (!/^\d{1,12}$/.test(raw)) return null
  const id = Number(raw)
  return Number.isSafeInteger(id) && id > 0 ? id : null
}

// One card shape for both the loaded finding and the backend-is-down fallback.
// Every branch emits og:title, og:description, og:url, og:type, og:image with
// its dimensions, and a large twitter card, because a throw in here left the
// 500 page with no social tags at all and links unfurled bare.
function findingCard(opts: {
  id: number
  title: string
  description: string
  publishedTime?: string
  degraded?: boolean
}): Metadata {
  const { id, title, description, publishedTime, degraded } = opts
  const canonical = `/f/${id}`
  const ogImage = `/og/finding/${id}.png`
  const imageAlt = `${title} · ${SITE_NAME}`

  return {
    title,
    description,
    alternates: { canonical },
    // Any numeric id reaches the degraded shell, existing or not, so a crawler
    // that lands on one during an outage must not index the stub.
    ...(degraded ? { robots: { index: false, follow: true } } : {}),
    openGraph: {
      title,
      description,
      type: 'article',
      siteName: SITE_NAME,
      url: canonical,
      publishedTime,
      images: [
        {
          url: ogImage,
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
      images: [{ url: ogImage, alt: imageAlt }],
    },
  }
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { id: raw } = await params
  const id = parseFindingId(raw)
  if (id === null) return { title: 'Finding not found', robots: { index: false } }

  let finding: Finding | null
  try {
    finding = await getFinding(id)
  } catch (err) {
    // getFinding turns a backend 404 into null and rethrows the rest, so only
    // a box that did not answer gets the degraded card. Anything else is a
    // defect and belongs in the error boundary, not in a reader-facing card.
    if (!isBackendUnreachable(err)) throw err
    return findingCard({
      id,
      title: `Finding ${id}`,
      description: FALLBACK_DESCRIPTION,
      degraded: true,
    })
  }
  if (!finding) return { title: 'Finding not found', robots: { index: false } }

  return findingCard({
    id: finding.id,
    title: finding.title,
    // A row with no summary must not throw out of generateMetadata: that is
    // the 500-with-no-og-tags this whole change exists to remove.
    description: (finding.summary ?? '').slice(0, 160) || FALLBACK_DESCRIPTION,
    publishedTime: finding.run_date,
  })
}

/** Shown when the backend times out. A 200 with a way onward beats a 500. */
function FindingUnavailable({ id }: { id: number }) {
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
          Finding {id}
        </h1>
        <p className="mt-3 max-w-[56ch] font-serif text-[1.0625rem] leading-[1.5] text-ink-soft">
          The archive did not answer in time. Retry in a minute, or pick up the trail from the wire.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <a
            href={`/f/${id}`}
            className="inline-block rounded-full bg-panel px-4 py-2 font-mono text-[0.65625rem] font-semibold uppercase tracking-[0.1em] text-ink hover:bg-ink hover:text-white focus-visible:outline-2 focus-visible:outline-ink focus-visible:outline-offset-2"
          >
            Retry
          </a>
          <Link
            href="/"
            className="inline-block rounded-full bg-panel px-4 py-2 font-mono text-[0.65625rem] font-semibold uppercase tracking-[0.1em] text-ink hover:bg-ink hover:text-white focus-visible:outline-2 focus-visible:outline-ink focus-visible:outline-offset-2"
          >
            The Wire
          </Link>
          <Link
            href="/briefings"
            className="inline-block rounded-full bg-panel px-4 py-2 font-mono text-[0.65625rem] font-semibold uppercase tracking-[0.1em] text-ink hover:bg-ink hover:text-white focus-visible:outline-2 focus-visible:outline-ink focus-visible:outline-offset-2"
          >
            Briefing archive
          </Link>
        </div>
      </main>
    </div>
  )
}

export default async function FindingPage({ params }: Params) {
  const { id: raw } = await params
  const id = parseFindingId(raw)
  if (id === null) notFound()

  // A timeout must not become a 500. Only the finding fetch decides which of
  // the three states (found, genuinely missing, backend down) this render is
  // in; the related trail is a fragment, so it falls back to empty on its own.
  const [finding, related] = await Promise.all([
    getFinding(id).catch((err: unknown) => {
      if (!isBackendUnreachable(err)) throw err
      return 'unreachable' as const
    }),
    getRelated(id, { limit: 8 }).catch(() => emptyRelated(id)),
  ])
  if (finding === 'unreachable') {
    // Keep the degraded render out of the full route cache, which `revalidate`
    // above would otherwise hold for a day on a URL that has real content.
    await connection()
    return <FindingUnavailable id={id} />
  }
  if (!finding) notFound()

  return (
    <div className="h-full">
      <RabbitHole initial={finding} initialRelated={related.items} />
    </div>
  )
}
