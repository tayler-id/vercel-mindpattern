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

      <article className="bg-card border border-border dossier-card px-6 py-8 report-article">
        <ReportMarkdown content={report.content} />
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
        h1: ({ children }) => (
          <h1 className="text-base font-bold uppercase tracking-[0.15em] text-foreground border-b-2 border-primary/30 pb-3 mb-6">{children}</h1>
        ),
        h2: ({ children }) => (
          <h2 className="text-sm font-bold uppercase tracking-[0.15em] text-foreground mt-10 mb-4 border-l-3 border-primary pl-3">{children}</h2>
        ),
        h3: ({ children }) => (
          <h3 className="text-xs font-bold uppercase tracking-[0.12em] text-foreground mt-8 mb-3">{children}</h3>
        ),
        p: ({ children }) => (
          <p className="text-[13px] leading-[1.8] text-muted-foreground mb-5">{children}</p>
        ),
        strong: ({ children }) => (
          <strong className="text-foreground font-bold">{children}</strong>
        ),
        a: ({ href, children }) => (
          <a href={href} target="_blank" rel="noopener noreferrer" className="text-navy underline underline-offset-2 hover:text-primary transition-colors">{children}</a>
        ),
        ul: ({ children }) => (
          <ul className="flex flex-col gap-2 mb-5 ml-4 list-disc marker:text-primary/40">{children}</ul>
        ),
        ol: ({ children }) => (
          <ol className="flex flex-col gap-2 mb-5 ml-4 list-decimal marker:text-primary/40">{children}</ol>
        ),
        li: ({ children }) => (
          <li className="text-[13px] leading-[1.8] text-muted-foreground">{children}</li>
        ),
        hr: () => (
          <hr className="my-8 border-t border-border" />
        ),
        blockquote: ({ children }) => (
          <blockquote className="border-l-3 border-olive pl-4 my-6 italic text-muted-foreground/80">{children}</blockquote>
        ),
        code: ({ children }) => (
          <code className="text-primary bg-primary/5 px-1.5 py-0.5 text-xs">{children}</code>
        ),
        table: ({ children }) => (
          <div className="overflow-x-auto my-6">
            <table className="w-full text-xs border-collapse">{children}</table>
          </div>
        ),
        th: ({ children }) => (
          <th className="text-left px-3 py-2 border-b-2 border-border font-bold text-foreground text-[10px] uppercase tracking-wider bg-muted/30">{children}</th>
        ),
        td: ({ children }) => (
          <td className="px-3 py-2 border-b border-border/50 text-[13px]">{children}</td>
        ),
      }}
    >
      {content}
    </Markdown>
  )
}
