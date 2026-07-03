import type { CSSProperties } from 'react'
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
import { sectionLabel } from '@/lib/sections'

export const revalidate = 60

const VIEWS = new Set(['trending', 'most-read', 'latest', 'topics'])

const HEADING: Record<string, { h1: string; sub: string }> = {
  trending: { h1: 'Trending now', sub: 'reader signal + source recurrence' },
  'most-read': { h1: 'Most read', sub: 'all-time reader favorites' },
  latest: { h1: 'Latest signals', sub: 'most recent first' },
  topics: { h1: 'By topic', sub: 'grouped by section' },
}

/** The complete published-story archive for the rail (bounded for safety).
    The backend rejects limit > 50, so page in 50s. */
async function getAllStories(cap = 300): Promise<{ items: PublicStory[]; total: number }> {
  const first = await getStories({ limit: 50 })
  const items = [...first.items]
  let total = first.total || items.length
  let hasMore = first.has_more
  while (hasMore && items.length < cap) {
    const page = await getStories({ limit: 50, offset: items.length })
    if (page.items.length === 0) break
    items.push(...page.items)
    hasMore = page.has_more
    total = page.total || total
  }
  return { items, total }
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

export default async function WirePage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>
}) {
  const sp = await searchParams
  const view = VIEWS.has(sp.view ?? '') ? (sp.view as string) : 'trending'

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
            {stats && (
              <p className="mt-4 font-mono text-[11.5px] uppercase tracking-[0.12em] text-ink-soft">
                <CountUp value={stats.findings} className="font-semibold text-ink" /> findings
                indexed · <CountUp value={stats.sources} className="font-semibold text-ink" />{' '}
                sources · <b className="font-semibold text-ink">+{today}</b>/day ·{' '}
                {HEADING[view].sub}
              </p>
            )}
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
    </div>
  )
}
