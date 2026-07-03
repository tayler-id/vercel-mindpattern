import type { Metadata } from 'next'
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
      <header className="mx-auto max-w-[44rem] px-8 pt-11 max-sm:px-5">
        <p className="type-kicker text-primary">
          Briefings
        </p>
        <h1 className="type-display mt-3 text-[2.75rem] font-[620] text-ink max-sm:text-[2rem]">
          The daily dispatch
        </h1>
        <p className="mt-3 font-serif text-[1.0625rem] italic leading-[1.6] text-ink-soft">
          One issue a day. The top stories, written long-form, with their sources.
        </p>
      </header>

      <ol className="mx-auto max-w-[44rem] px-8 pb-24 pt-6 max-sm:px-5">
        {reports.map((r) => {
          const audio = audioByDate.get(r.date)
          return (
            <li key={r.date} className="rule-row py-5">
              <Link
                href={`/briefings/${r.date}`}
                className="group block"
              >
                <div className="type-kicker text-primary">
                  {shortDate(r.date)}
                </div>
                <div className="type-display mt-1.5 text-[1.375rem] font-[560] text-ink group-hover:underline">
                  {r.title}
                </div>
                {r.subtitle && (
                  <p className="mt-1.5 max-w-[42rem] font-serif text-[0.9375rem] leading-[1.6] text-ink-soft">
                    {r.subtitle}
                  </p>
                )}
              </Link>
              {audio && <AudioBriefingPlayer audio={audio} compact />}
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
