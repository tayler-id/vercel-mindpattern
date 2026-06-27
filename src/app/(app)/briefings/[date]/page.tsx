import type { Metadata } from 'next'
import Link from 'next/link'
import { getReport, getReports } from '@/lib/api'
import type { Report, ReportListItem } from '@/lib/types'
import { JsonLd } from '@/components/json-ld'
import { ReportMarkdown } from '@/components/briefing/report-markdown'
import { absoluteUrl, shortReportDescription, SITE_NAME } from '@/lib/site'
import { shortDate } from '@/lib/format'

export const revalidate = 60

type Params = { params: Promise<{ date: string }> }

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { date } = await params
  try {
    const report = await getReport(date)
    const description = shortReportDescription(report.title, date)
    return {
      title: report.title,
      description,
      alternates: { canonical: `/briefings/${date}` },
      openGraph: {
        type: 'article',
        title: report.title,
        description,
        url: `/briefings/${date}`,
        publishedTime: date,
      },
    }
  } catch {
    return { title: 'Briefing not found', robots: { index: false, follow: false } }
  }
}

export default async function BriefingPage({ params }: Params) {
  const { date } = await params

  let report: Report | null = null
  let list: ReportListItem[] = []
  try {
    ;[report, list] = await Promise.all([getReport(date), getReports()])
  } catch {
    /* handled below */
  }

  if (!report) {
    return (
      <div className="mx-auto max-w-[44rem] px-8 py-16 text-center max-sm:px-5">
        <Link href="/briefings" className="font-mono text-[0.78125rem] font-semibold text-primary hover:underline">
          ← Briefings
        </Link>
        <p className="mt-10 font-mono text-[0.8125rem] uppercase tracking-[0.12em] text-ink-faint">
          The briefing for {date} could not be loaded.
        </p>
      </div>
    )
  }

  const wordCount = report.content.split(/\s+/).length
  const readTime = Math.max(1, Math.round(wordCount / 200))
  const dates = list.map((r) => r.date).sort()
  const i = dates.indexOf(date)
  const prev = i > 0 ? dates[i - 1] : null
  const next = i >= 0 && i < dates.length - 1 ? dates[i + 1] : null

  return (
    <div className="h-full overflow-y-auto">
      <article className="mx-auto max-w-[44rem] px-8 pb-24 pt-11 max-sm:px-5">
        <JsonLd
          data={{
            '@context': 'https://schema.org',
            '@type': 'Article',
            '@id': absoluteUrl(`/briefings/${date}#article`),
            headline: report.title,
            description: shortReportDescription(report.title, date),
            url: absoluteUrl(`/briefings/${date}`),
            datePublished: date,
            dateModified: date,
            wordCount,
            inLanguage: 'en-US',
            author: { '@type': 'Organization', name: SITE_NAME, url: absoluteUrl('/') },
            publisher: { '@type': 'Organization', name: SITE_NAME, url: absoluteUrl('/') },
          }}
        />

        <Link href="/briefings" className="font-mono text-[0.78125rem] font-semibold text-primary hover:underline">
          ← Briefings
        </Link>

        <header className="mb-8 mt-8 border-b border-line pb-6">
          <p className="font-mono text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-primary">
            {shortDate(date)}
          </p>
          <h1 className="mt-3 font-serif text-[2.5rem] font-semibold leading-[1.1] tracking-[-0.02em] text-ink max-sm:text-[2rem]">
            {report.title}
          </h1>
          <p className="mt-3 font-mono text-[0.6875rem] text-ink-faint">
            {wordCount.toLocaleString()} words · {readTime} min read
          </p>
        </header>

        <ReportMarkdown content={report.content} />

        {(prev || next) && (
          <nav className="mt-12 flex items-center justify-between gap-4 border-t border-line pt-6 font-mono text-[0.71875rem] font-semibold">
            {prev ? (
              <Link href={`/briefings/${prev}`} className="text-primary hover:underline">
                ← {shortDate(prev)}
              </Link>
            ) : (
              <span />
            )}
            {next ? (
              <Link href={`/briefings/${next}`} className="text-primary hover:underline">
                {shortDate(next)} →
              </Link>
            ) : (
              <span />
            )}
          </nav>
        )}
      </article>
    </div>
  )
}
