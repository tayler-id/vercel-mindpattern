import Link from 'next/link'
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { backendFetch } from '@/lib/api'
import type { Report, ReportListItem } from '@/lib/types'

export const dynamic = 'force-dynamic'

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ date: string }>
}) {
  const { date } = await params

  let report: Report | null = null
  let reportList: ReportListItem[] = []

  try {
    ;[report, reportList] = await Promise.all([
      backendFetch<Report>(`/api/reports/${date}`, { user: 'ramsay' }),
      backendFetch<ReportListItem[]>('/api/reports', { user: 'ramsay' }),
    ])
  } catch {
    // Either the report or list fetch failed
  }

  if (!report) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <Link
          href="/blog"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
        >
          <ArrowLeftIcon />
          Back to archive
        </Link>
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-sm text-muted-foreground">Report not found.</p>
          <p className="text-xs text-muted-foreground/60 mt-1">
            The report for {date} may not exist or the backend is unavailable.
          </p>
        </div>
      </div>
    )
  }

  const wordCount = report.content.split(/\s+/).length
  const readTime = Math.max(1, Math.round(wordCount / 200))
  const formattedDate = new Date(date + 'T00:00:00').toLocaleDateString(
    'en-US',
    {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }
  )

  // Find prev/next reports
  const sortedDates = reportList.map((r) => r.date).sort()
  const currentIndex = sortedDates.indexOf(date)
  const prevDate = currentIndex > 0 ? sortedDates[currentIndex - 1] : null
  const nextDate =
    currentIndex >= 0 && currentIndex < sortedDates.length - 1
      ? sortedDates[currentIndex + 1]
      : null

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <Link
        href="/blog"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeftIcon />
        Back to archive
      </Link>

      <header className="mt-6 mb-8">
        <h1 className="text-2xl font-bold tracking-tight">{report.title}</h1>
        <p className="text-sm text-muted-foreground mt-2">
          {formattedDate} &middot; {wordCount.toLocaleString()} words &middot;{' '}
          {readTime} min read
        </p>
      </header>

      <article className="bg-card border border-border rounded-xl px-6 py-6">
        <div className="prose prose-invert prose-sm max-w-none prose-p:text-muted-foreground prose-a:text-primary prose-headings:text-foreground prose-strong:text-foreground">
          <ReportMarkdown content={report.content} />
        </div>
      </article>

      {(prevDate || nextDate) && (
        <nav className="mt-8 flex items-center justify-between gap-4">
          {prevDate ? (
            <Link
              href={`/blog/${prevDate}`}
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeftIcon />
              {formatShortDate(prevDate)}
            </Link>
          ) : (
            <span />
          )}
          {nextDate ? (
            <Link
              href={`/blog/${nextDate}`}
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {formatShortDate(nextDate)}
              <ArrowRightIcon />
            </Link>
          ) : (
            <span />
          )}
        </nav>
      )}
    </div>
  )
}

function ReportMarkdown({ content }: { content: string }) {
  return (
    <Markdown
      remarkPlugins={[remarkGfm]}
      components={{
        a: ({ href, children }) => (
          <a href={href} target="_blank" rel="noopener noreferrer">{children}</a>
        ),
        table: ({ children }) => (
          <div className="overflow-x-auto my-4">
            <table className="w-full text-sm border-collapse">{children}</table>
          </div>
        ),
        th: ({ children }) => (
          <th className="text-left px-3 py-2 border-b border-border font-medium text-foreground">{children}</th>
        ),
        td: ({ children }) => (
          <td className="px-3 py-2 border-b border-border/50">{children}</td>
        ),
      }}
    >
      {content}
    </Markdown>
  )
}

function formatShortDate(dateStr: string): string {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
}

function ArrowLeftIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path
        d="M9 3L5 7l4 4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function ArrowRightIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path
        d="M5 3l4 4-4 4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
