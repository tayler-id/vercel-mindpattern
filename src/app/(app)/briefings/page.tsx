import type { Metadata } from 'next'
import Link from 'next/link'
import { getReports } from '@/lib/api'
import type { ReportListItem } from '@/lib/types'
import { shortDate } from '@/lib/format'

export const revalidate = 60

export const metadata: Metadata = {
  title: 'Briefings',
  description: 'The daily MindPattern AI research briefing — top stories, long-form, with sources.',
}

export default async function BriefingsPage() {
  let reports: ReportListItem[] = []
  let error = false
  try {
    reports = await getReports()
  } catch {
    error = true
  }

  return (
    <div className="h-full overflow-y-auto">
      <header className="mx-auto max-w-[44rem] px-8 pt-11 max-sm:px-5">
        <p className="font-mono text-[0.6875rem] font-semibold uppercase tracking-[0.16em] text-primary">
          Briefings
        </p>
        <h1 className="mt-2 font-serif text-[2.25rem] font-semibold leading-[1.1] tracking-[-0.02em] text-ink">
          The daily dispatch
        </h1>
        <p className="mt-3 font-mono text-[0.71875rem] text-ink-faint">
          One issue a day — the top stories, written long-form, with their sources.
        </p>
      </header>

      <ol className="mx-auto max-w-[44rem] px-8 pb-24 pt-6 max-sm:px-5">
        {reports.map((r) => (
          <li key={r.date}>
            <Link
              href={`/briefings/${r.date}`}
              className="block border-b border-line-soft py-4 transition-colors hover:bg-card"
            >
              <div className="font-mono text-[0.71875rem] font-semibold text-primary">
                {shortDate(r.date)}
              </div>
              <div className="mt-1 font-serif text-[1.25rem] font-semibold leading-snug tracking-[-0.01em] text-ink">
                {r.title}
              </div>
              {r.subtitle && (
                <p className="mt-1 line-clamp-2 text-[0.875rem] text-ink-soft">{r.subtitle}</p>
              )}
            </Link>
          </li>
        ))}
        {error && (
          <li className="py-10 text-center font-mono text-[0.8125rem] text-ink-faint">
            Couldn&rsquo;t load the archive. Refresh in a moment.
          </li>
        )}
      </ol>
    </div>
  )
}
