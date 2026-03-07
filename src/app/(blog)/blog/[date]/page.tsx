import Link from 'next/link'
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { ChevronLeft, ChevronRight } from 'lucide-react'
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
          className="inline-flex items-center gap-1.5 text-[10px] text-muted-foreground hover:text-foreground transition-colors mb-8 uppercase tracking-wider font-bold"
        >
          <ChevronLeft data-icon="inline-start" />
          Back to archive
        </Link>
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-xs text-muted-foreground uppercase tracking-[0.15em] font-bold">
            [REPORT NOT FOUND]
          </p>
          <p className="text-[10px] text-muted-foreground/60 mt-1 uppercase tracking-wider">
            The briefing for {date} may not exist or the backend is unavailable.
          </p>
        </div>
      </div>
    )
  }

  const wordCount = report.content.split(/\s+/).length
  const readTime = Math.max(1, Math.round(wordCount / 200))

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
        className="inline-flex items-center gap-1.5 text-[10px] text-muted-foreground hover:text-foreground transition-colors uppercase tracking-wider font-bold"
      >
        <ChevronLeft data-icon="inline-start" />
        Back to archive
      </Link>

      <header className="mt-6 mb-8">
        <h1 className="text-sm font-bold uppercase tracking-[0.15em]">{report.title}</h1>
        <p className="text-[10px] text-muted-foreground mt-2 uppercase tracking-wider">
          [{date}] -- {wordCount.toLocaleString()} words -- {readTime} min read
        </p>
      </header>

      <article className="bg-card border border-border dossier-card px-6 py-6">
        <div className="prose prose-sm max-w-none prose-p:text-muted-foreground prose-a:text-navy prose-headings:text-foreground prose-headings:uppercase prose-headings:tracking-wider prose-strong:text-foreground prose-code:text-primary prose-code:bg-primary/5 prose-code:px-1">
          <ReportMarkdown content={report.content} />
        </div>
      </article>

      {(prevDate || nextDate) && (
        <nav className="mt-8 flex items-center justify-between gap-4">
          {prevDate ? (
            <Link
              href={`/blog/${prevDate}`}
              className="inline-flex items-center gap-1.5 text-[10px] text-muted-foreground hover:text-foreground transition-colors uppercase tracking-wider font-bold"
            >
              <ChevronLeft data-icon="inline-start" />
              [{prevDate}]
            </Link>
          ) : (
            <span />
          )}
          {nextDate ? (
            <Link
              href={`/blog/${nextDate}`}
              className="inline-flex items-center gap-1.5 text-[10px] text-muted-foreground hover:text-foreground transition-colors uppercase tracking-wider font-bold"
            >
              [{nextDate}]
              <ChevronRight data-icon="inline-end" />
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
            <table className="w-full text-xs border-collapse">{children}</table>
          </div>
        ),
        th: ({ children }) => (
          <th className="text-left px-3 py-2 border-b border-border font-bold text-foreground text-[10px] uppercase tracking-wider">{children}</th>
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
