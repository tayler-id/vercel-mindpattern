import type { Metadata } from 'next'
import { topicStyleVars } from '@/lib/topics'
import type { CSSProperties } from 'react'
import Link from 'next/link'
import { AudioBriefingPlayer } from '@/components/briefing/audio-briefing-player'
import { getAudioBriefings, getReports } from '@/lib/api'
import type { AudioBriefing, ReportListItem } from '@/lib/types'
import { shortDate } from '@/lib/format'

export const revalidate = 60
export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Briefings',
  description: 'The daily MindPattern AI research briefing. Top stories, long-form, with sources.',
}

export default async function BriefingsPage() {
  let reports: ReportListItem[] = []
  let audioBriefings: AudioBriefing[] = []
  let error = false
  try {
    reports = await getReports()
  } catch {
    error = true
  }
  try {
    audioBriefings = await getAudioBriefings()
  } catch {
    audioBriefings = []
  }

  const audioByDate = new Map(audioBriefings.map((audio) => [audio.date, audio]))

  return (
    <div className="h-full overflow-y-auto">
      <header className="mx-auto max-w-[720px] px-8 pt-11 max-sm:px-5">
        <p className="rise-in type-kicker text-primary" style={{ '--i': 0 } as CSSProperties}>
          Briefings
        </p>
        <h1
          className="rise-in type-display mt-2 text-[clamp(2.5rem,6vw,4.25rem)] uppercase leading-[0.95] tracking-[-0.02em] text-ink"
          style={{ '--i': 1, fontVariationSettings: '"wdth" 118', fontWeight: 850 } as CSSProperties}
        >
          The daily dispatch
        </h1>
        <p className="rise-in mt-2 max-w-[52ch] font-serif text-[1.1875rem] leading-[1.5] text-ink-soft" style={{ '--i': 2 } as CSSProperties}>
          One issue a day. The top stories, written long-form, with their sources.
        </p>
      </header>

      <ol className="mx-auto max-w-[720px] px-8 pb-24 pt-8 max-sm:px-5">
        {reports.map((r, index) => {
          const audio = audioByDate.get(r.date)
          return (
            <li
              key={r.date}
              className="rule-row"
              style={{ ...topicStyleVars(null), '--i': index } as CSSProperties}
            >
              <div className={index < 8 ? 'rise-in' : 'scroll-rise'}>
                <Link href={`/briefings/${r.date}`} className="flood-row block px-4 py-5">
                  <p className="type-kicker text-[color:var(--tc-text)]">{shortDate(r.date)}</p>
                  <h2
                    className="type-display mt-2 text-[25px] leading-[1.04] text-ink"
                    style={{ fontVariationSettings: '"wdth" 108', fontWeight: 760 }}
                  >
                    {r.title}
                  </h2>
                  {r.subtitle && (
                    <p className="mt-2 max-w-[46rem] font-serif text-[0.9375rem] leading-[1.55] text-ink-soft">
                      {r.subtitle}
                    </p>
                  )}
                </Link>
                {audio && (
                  <div className="px-4 pb-4">
                    <AudioBriefingPlayer audio={audio} compact />
                  </div>
                )}
              </div>
            </li>
          )
        })}
        {error && (
          <li className="py-10 text-center font-mono text-[0.8125rem] text-ink-faint">
            Couldn&rsquo;t load the archive. Refresh in a moment.
          </li>
        )}
      </ol>
    </div>
  )
}
