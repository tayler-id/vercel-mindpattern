import { getFeed, getFindings, getPopular, getStats, getStories, getTrending } from '@/lib/api'
import type { FeedItem, Finding, PublicStory, Stats } from '@/lib/types'
import { WireList } from '@/components/wire/wire-list'
import { WireRow } from '@/components/wire/wire-row'
import { WireTabs } from '@/components/wire/wire-tabs'
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

export default async function WirePage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>
}) {
  const sp = await searchParams
  const view = VIEWS.has(sp.view ?? '') ? (sp.view as string) : 'trending'

  const stats = await getStats().catch(() => null as Stats | null)
  const today = stats ? (Object.entries(stats.by_date).sort().at(-1)?.[1] ?? 0) : 0

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

  return (
    <div className="h-full overflow-y-auto">
      <header className="mx-auto max-w-[1080px] px-8 pt-9 max-sm:px-[18px]">
        <p className="flex items-center gap-2 font-mono text-[0.6875rem] font-semibold uppercase text-primary">
          <span className="inline-block size-1.5 animate-pulse rounded-full bg-primary" aria-hidden />
          The Wire · Live
        </p>
        <h1 className="mt-2 text-[1.875rem] font-extrabold text-ink">
          {HEADING[view].h1}
        </h1>
        {stats && (
          <p className="mt-2 font-mono text-[0.71875rem] text-ink-faint">
            <b className="font-semibold text-ink-soft">{stats.findings.toLocaleString()}</b> findings
            indexed · <b className="font-semibold text-ink-soft">{stats.sources.toLocaleString()}</b>{' '}
            sources · <b className="font-semibold text-ink-soft">+{today}</b>/day · {HEADING[view].sub}
          </p>
        )}
        <WireTabs active={view} />
      </header>

      <div className="mx-auto max-w-[1080px] px-4 pb-[90px] pt-1.5 max-sm:px-1.5">
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
        ) : view === 'topics' ? (
          Object.entries(grouped).map(([section, items]) => (
            <section key={section} className="mb-5">
              <h2 className="px-3 pb-1 pt-5 font-mono text-[0.6875rem] font-semibold uppercase text-primary">
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
        ) : (
          <ol>
            {findings.map((f, i) => (
              <li key={f.id}>
                <WireRow finding={f} rank={i + 1} />
              </li>
            ))}
          </ol>
        )}
        {!hasItems && (
          <p className="px-4 py-10 text-center font-mono text-[0.8125rem] text-ink-faint">
            The wire is quiet. Nothing is loading right now.
          </p>
        )}
      </div>

      <SubscribeBand />
    </div>
  )
}
