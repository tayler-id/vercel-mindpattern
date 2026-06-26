import { getFindings } from '@/lib/api'
import type { Finding } from '@/lib/types'
import { WireRow } from '@/components/wire/wire-row'
import { SubscribeBand } from '@/components/subscribe/subscribe-band'

export const revalidate = 60

export default async function WirePage() {
  let findings: Finding[] = []
  let error = false
  try {
    findings = await getFindings({ limit: 60 })
  } catch {
    error = true
  }

  return (
    <div className="h-full overflow-y-auto">
      <header className="mx-auto max-w-[1080px] px-8 pt-9 max-sm:px-[18px]">
        <p className="font-mono text-[0.6875rem] font-semibold uppercase tracking-[0.16em] text-primary">
          The Wire
        </p>
        <h1 className="mt-2 text-[1.875rem] font-extrabold tracking-[-0.03em] text-ink">
          What&rsquo;s moving in AI
        </h1>
        <p className="mt-2 font-mono text-[0.71875rem] text-ink-faint">
          The latest <b className="font-semibold text-ink-soft">{findings.length}</b> signals from
          the research pipeline. Click any to follow the thread.
        </p>
      </header>

      <ol className="mx-auto max-w-[1080px] px-4 pb-[70px] pt-1.5 max-sm:px-1.5">
        {findings.map((f, i) => (
          <li key={f.id}>
            <WireRow finding={f} rank={i + 1} />
          </li>
        ))}
        {error && (
          <li className="px-4 py-10 text-center font-mono text-[0.8125rem] text-ink-faint">
            The wire is quiet — couldn&rsquo;t reach the pipeline. Refresh in a moment.
          </li>
        )}
      </ol>

      <SubscribeBand />
    </div>
  )
}
