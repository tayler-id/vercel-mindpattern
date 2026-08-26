import type { CSSProperties } from 'react'
import type { Metadata } from 'next'
import {
  getFeed,
  getFindings,
  getPopular,
  getReports,
  getStats,
  getStories,
  getTrending,
} from '@/lib/api'
import type { FeedItem, Finding, PublicStory, ReportListItem, Stats } from '@/lib/types'
import { WireList } from '@/components/wire/wire-list'
import { WireRow } from '@/components/wire/wire-row'
import { WireTabs } from '@/components/wire/wire-tabs'
import { WireTicker } from '@/components/wire/wire-ticker'
import { FullWireRail } from '@/components/wire/full-wire-rail'
import { BriefingCircle } from '@/components/wire/briefing-circle'
import { KnowledgeGraph, type GraphNode } from '@/components/graph/knowledge-graph'
import { CountUp } from '@/components/motion/count-up'
import { SubscribeBand } from '@/components/subscribe/subscribe-band'
import { ConsultBand } from '@/components/consult/consult-band'
import { ShareButton } from '@/components/story/share-button'
import { sectionLabel } from '@/lib/sections'
import { SITE_NAME, SITE_TITLE } from '@/lib/site'
import { resolveWireView, WIRE_HEADING, wireViewPath } from '@/lib/wire-views'

export const revalidate = 300

const HEADING = WIRE_HEADING

type WireSearchParams = { searchParams: Promise<{ view?: string }> }

/**
 * Each tab is a shareable link, so metadata is per view: without this the
 * whole wire unfurled as the generic site card and `/?view=latest` was
 * indistinguishable from `/`.
 *
 * Nothing here touches the backend, which is the point. The front page is the
 * one link that has to unfurl while Fly is wedged, and `/og/view/[view]`
 * renders from the view name alone, so the image resolves too. A page-level
 * openGraph object replaces the root's rather than merging into it, so
 * siteName and the large twitter card are repeated here instead of inherited.
 */
export async function generateMetadata({ searchParams }: WireSearchParams): Promise<Metadata> {
  const view = resolveWireView((await searchParams).view)
  const heading = HEADING[view]
  const path = wireViewPath(view)
  const title = view === 'trending' ? SITE_TITLE : `${heading.h1} · ${heading.sub}`
  const description = `${heading.h1} on ${SITE_NAME}: ${heading.sub}, from an autonomous AI research pipeline.`
  const images = [
    { url: `/og/view/${view}`, width: 1200, height: 630, type: 'image/png', alt: heading.share },
  ]

  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: { type: 'website', siteName: SITE_NAME, title, description, url: path, images },
    twitter: { card: 'summary_large_image', title, description, images },
  }
}

/** The complete published-story archive for the rail (bounded for safety).
    The backend rejects limit > 50, so page in 50s — all pages in parallel,
    not a sequential round-trip chain. */
async function getAllStories(cap = 300): Promise<{ items: PublicStory[]; total: number }> {
  const first = await getStories({ limit: 50 })
  const items = [...first.items]
  const total = first.total || items.length
  if (!first.has_more || items.length >= cap) return { items, total }
  const remaining = Math.min(total, cap) - items.length
  const offsets = Array.from(
    { length: Math.ceil(Math.max(remaining, 0) / 50) },
    (_, i) => 50 * (i + 1),
  )
  const pages = await Promise.all(
    offsets.map((offset) =>
      getStories({ limit: 50, offset }).catch(() => ({ items: [] as PublicStory[] })),
    ),
  )
  for (const page of pages) items.push(...page.items)
  return { items: items.slice(0, cap), total }
}

/** Real graph input: the wire's top stories (or findings) + their relations. */
function toGraphNodes(
  stories: PublicStory[],
  findings: Array<Finding | FeedItem>,
  archive: PublicStory[],
): GraphNode[] {
  const storyPool = stories.length > 0 ? stories : archive
  if (storyPool.length > 0) {
    const top = storyPool.slice(0, 36)
    return top.map((s, i) => ({
      slug: s.slug,
      title: s.title,
      section: s.section_id || '',
      weight: 1 - i / top.length,
      entities: (s.entity_refs ?? []).slice(0, 6).map((e) => e.slug),
      href: `/s/${encodeURIComponent(s.slug)}`,
    }))
  }
  const top = findings.slice(0, 36)
  return top.map((f, i) => ({
    slug: String(f.id),
    title: f.title,
    section: f.agent,
    weight: 1 - i / top.length,
    entities: (f.entities ?? []).slice(0, 6).map((e) => e.slug),
    href: `/f/${f.id}`,
  }))
}

export default async function WirePage({ searchParams }: WireSearchParams) {
  const sp = await searchParams
  const view = resolveWireView(sp.view)

  const [stats, reports, archive] = await Promise.all([
    getStats().catch(() => null as Stats | null),
    getReports().catch(() => [] as ReportListItem[]),
    getAllStories().catch(() => ({ items: [] as PublicStory[], total: 0 })),
  ])
  const today = stats ? (Object.entries(stats.by_date).sort().at(-1)?.[1] ?? 0) : 0
  const latestReport =
    reports.length > 0
      ? [...reports].sort((a, b) => b.date.localeCompare(a.date))[0]
      : null

  let findings: Array<Finding | FeedItem> = []
  let stories: PublicStory[] = []
  try {
    if (view === 'topics') {
      findings = await getFindings({ importance: 'high', limit: 80 })
    } else if (view === 'latest') {
      const feed = await getFeed({ limit: 60 })
      findings = feed.items
    } else if (view === 'most-read') {
      // Real reads rank first; newest stories fill the rest while the
      // event store is young so the tab is always a full page.
      const [popular, latest] = await Promise.all([
        getPopular({ window: 'all', limit: 50 }),
        getStories({ limit: 50 }),
      ])
      const seen = new Set(popular.items.map((s) => s.slug))
      stories = [...popular.items, ...latest.items.filter((s) => !seen.has(s.slug))].slice(0, 50)
    } else {
      // Trending: blended reader-signal + corpus score, newest pool of 400.
      const trending = await getTrending({ limit: 60 })
      stories = trending.items
      if (stories.length < 20) {
        // Cold start (no events yet): fall back to newest-first.
        const [first, second] = await Promise.all([
          getStories({ limit: 50 }),
          getStories({ limit: 50, offset: 50 }),
        ])
        stories = [...first.items, ...second.items]
      }
    }
  } catch {
    try {
      findings =
        view === 'latest'
          ? await getFindings({ limit: 40 })
          : await getFindings({ importance: 'high', limit: 40 })
    } catch {
      /* empty state below */
    }
  }

  const hasItems = stories.length > 0 || findings.length > 0
  const grouped: Record<string, Array<Finding | FeedItem>> = {}
  if (view === 'topics') {
    for (const f of findings) {
      const s = sectionLabel(f.agent)
      ;(grouped[s] ??= []).push(f)
    }
  }

  const graphNodes = toGraphNodes(stories, findings, archive.items)

  // H1 with the last word in an ink flood box (per the approved mockup).
  const h1Words = HEADING[view].h1.split(' ')
  const h1Last = h1Words.pop()

  return (
    <div>
      {stats && <WireTicker stats={stats} today={today} />}

      {graphNodes.length > 0 && (
        <KnowledgeGraph nodes={graphNodes} findingCount={stats?.findings ?? graphNodes.length} />
      )}

      <div className="mx-auto grid max-w-[1240px] grid-cols-1 gap-x-12 px-8 pb-16 pt-10 max-sm:px-5 lg:grid-cols-[1fr_300px]">
        <div className="min-w-0">
          <header>
            <p className="type-kicker flex items-center gap-2 text-primary">
              <span className="inline-block size-1.5 animate-pulse rounded-full bg-primary" aria-hidden />
              The Wire · Live
            </p>
            <h1
              className="type-display mt-3 text-[clamp(40px,5.6vw,68px)] uppercase leading-[0.95] tracking-[-0.02em] text-ink"
              style={{ fontVariationSettings: '"wdth" 118', fontWeight: 850 }}
            >
              {h1Words.join(' ')}{' '}
              <span className="bg-ink px-[0.12em] text-paper">{h1Last}</span>
            </h1>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
              {stats && (
                <p className="font-mono text-[11.5px] uppercase tracking-[0.12em] text-ink-soft">
                  <CountUp value={stats.findings} className="font-semibold text-ink" /> findings
                  indexed · <CountUp value={stats.sources} className="font-semibold text-ink" />{' '}
                  sources · <b className="font-semibold text-ink">+{today}</b>/day ·{' '}
                  {HEADING[view].sub}
                </p>
              )}
              <ShareButton
                title={HEADING[view].share}
                url={wireViewPath(view)}
                className="ml-auto"
              />
            </div>
            <WireTabs active={view} />
          </header>

          <div className="pt-2">
            {view !== 'topics' ? (
              stories.length > 0 ? (
                <WireList stories={stories} canLoadMore={view === 'latest'} />
              ) : (
                <ol>
                  {findings.map((f, i) => (
                    <li key={f.id}>
                      <WireRow finding={f} rank={i + 1} />
                    </li>
                  ))}
                </ol>
              )
            ) : (
              Object.entries(grouped).map(([section, items]) => (
                <section key={section} className="mb-10">
                  <h2 className="type-kicker border-t border-ink px-4 pb-2 pt-3 text-primary">
                    {section}
                    <span className="ml-2 text-ink-faint">{items.length}</span>
                  </h2>
                  <ol>
                    {items.map((f, i) => (
                      <li key={f.id}>
                        <WireRow finding={f} rank={i + 1} />
                      </li>
                    ))}
                  </ol>
                </section>
              ))
            )}
            {!hasItems && (
              <p className="px-4 py-10 text-center font-mono text-[0.8125rem] text-ink-faint">
                The wire is quiet. Nothing is loading right now.
              </p>
            )}
          </div>
        </div>

        <aside
          aria-label="The full wire"
          className="rise-in mt-10 lg:mt-2"
          style={{ '--i': '4' } as CSSProperties}
        >
          {latestReport && <BriefingCircle report={latestReport} />}
          {archive.items.length > 0 && (
            <FullWireRail stories={archive.items} total={archive.total} />
          )}
        </aside>
      </div>

      <SubscribeBand />
      <ConsultBand />
    </div>
  )
}
