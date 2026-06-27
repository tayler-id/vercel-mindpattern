import { getFindings, getStats } from '@/lib/api'
import type { Finding, Stats } from '@/lib/types'
import { WireRow } from '@/components/wire/wire-row'
import { WireTabs } from '@/components/wire/wire-tabs'
import { SubscribeBand } from '@/components/subscribe/subscribe-band'

export const revalidate = 60

export default async function WirePage() {
  const [findings, stats] = await Promise.all([
    getFindings({ importance: 'high', limit: 40 }).catch(() => [] as Finding[]),
    getStats().catch(() => null as Stats | null),
  ])
  const today = stats ? (Object.entries(stats.by_date).sort().at(-1)?.[1] ?? 0) : 0

  return (
    <div className="h-full overflow-y-auto">
      <header className="mx-auto max-w-[1080px] px-8 pt-9 max-sm:px-[18px]">
        <p className="flex items-center gap-2 font-mono text-[0.6875rem] font-semibold uppercase tracking-[0.16em] text-primary">
          <span className="inline-block size-1.5 animate-pulse rounded-full bg-primary" aria-hidden />
          The Wire · Live
        </p>
        <h1 className="mt-2 text-[1.875rem] font-extrabold tracking-[-0.03em] text-ink">
          Trending now
        </h1>
        {stats && (
          <p className="mt-2 font-mono text-[0.71875rem] text-ink-faint">
            <b className="font-semibold text-ink-soft">{stats.findings.toLocaleString()}</b> findings
            indexed · <b className="font-semibold text-ink-soft">{stats.sources.toLocaleString()}</b>{' '}
            sources · <b className="font-semibold text-ink-soft">+{today}</b>/day · high-signal first
          </p>
        )}
        <WireTabs />
      </header>

      <ol className="mx-auto max-w-[1080px] px-4 pb-[90px] pt-1.5 max-sm:px-1.5">
        {findings.map((f, i) => (
          <li key={f.id}>
            <WireRow finding={f} rank={i + 1} />
          </li>
        ))}
        {!findings.length && (
          <li className="px-4 py-10 text-center font-mono text-[0.8125rem] text-ink-faint">
            The wire is quiet — couldn&rsquo;t reach the pipeline.
          </li>
        )}
      </ol>

      <SubscribeBand />
    </div>
  )
}
