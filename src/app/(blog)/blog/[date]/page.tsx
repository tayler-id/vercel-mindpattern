import type { Metadata } from 'next'
import Link from 'next/link'
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { backendFetch } from '@/lib/api'
import { JsonLd } from '@/components/json-ld'
import { absoluteUrl, shortReportDescription, SITE_NAME } from '@/lib/site'
import type { Report, ReportListItem } from '@/lib/types'

export const revalidate = 3600

type BlogPostParams = {
  params: Promise<{ date: string }>
}

export async function generateMetadata({
  params,
}: BlogPostParams): Promise<Metadata> {
  const { date } = await params

  try {
    const report = await backendFetch<Report>(`/api/reports/${date}`, {
      user: 'ramsay',
    })
    const description = shortReportDescription(report.title, date)

    return {
      title: report.title,
      description,
      alternates: {
        canonical: `/blog/${date}`,
      },
      openGraph: {
        type: 'article',
        title: report.title,
        description,
        url: `/blog/${date}`,
        publishedTime: date,
        modifiedTime: date,
      },
    }
  } catch {
    return {
      title: 'AI Research Briefing Not Found',
      description: `The MindPattern AI research briefing for ${date} could not be loaded.`,
      alternates: {
        canonical: `/blog/${date}`,
      },
      robots: {
        index: false,
        follow: false,
      },
    }
  }
}

export default async function BlogPostPage({
  params,
}: BlogPostParams) {
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
      <div className="max-w-[720px] mx-auto px-5 py-8 md:px-8">
        <Link
          href="/blog"
          className="type-kicker inline-flex items-center gap-1.5 text-ink-faint hover:text-primary transition-colors mb-8"
        >
          <ChevronLeft data-icon="inline-start" className="size-3.5" />
          Back to archive
        </Link>
        <div className="rule-row flex flex-col items-center justify-center py-16 text-center">
          <p className="type-kicker text-ink-soft">
            [REPORT NOT FOUND]
          </p>
          <p className="type-kicker text-ink-faint mt-1">
            The briefing for {date} may not exist or the backend is unavailable.
          </p>
        </div>
      </div>
    )
  }

  const wordCount = report.content.split(/\s+/).length
  const readTime = Math.max(1, Math.round(wordCount / 200))
  const description = shortReportDescription(report.title, date)
  const citations = extractCitations(report.content)

  const sortedDates = reportList.map((r) => r.date).sort()
  const currentIndex = sortedDates.indexOf(date)
  const prevDate = currentIndex > 0 ? sortedDates[currentIndex - 1] : null
  const nextDate =
    currentIndex >= 0 && currentIndex < sortedDates.length - 1
      ? sortedDates[currentIndex + 1]
      : null

  return (
    <div className="max-w-[720px] mx-auto px-5 py-8 md:px-8">
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'Article',
          '@id': absoluteUrl(`/blog/${date}#article`),
          headline: report.title,
          description,
          url: absoluteUrl(`/blog/${date}`),
          datePublished: date,
          dateModified: date,
          wordCount,
          inLanguage: 'en-US',
          author: {
            '@type': 'Organization',
            name: SITE_NAME,
            url: absoluteUrl('/'),
          },
          publisher: {
            '@type': 'Organization',
            name: SITE_NAME,
            url: absoluteUrl('/'),
          },
          isPartOf: {
            '@id': absoluteUrl('/blog#archive'),
          },
          citation: citations,
        }}
      />
      <Link
        href="/blog"
        className="type-kicker inline-flex items-center gap-1.5 text-ink-faint hover:text-primary transition-colors"
      >
        <ChevronLeft data-icon="inline-start" className="size-3.5" />
        Back to archive
      </Link>

      <header className="mt-6 mb-8 border-t-[3px] border-ink pt-3">
        <h1
          className="type-display uppercase text-[clamp(36px,5vw,56px)] leading-[0.98] text-ink"
          style={{ fontVariationSettings: '"wdth" 114', fontWeight: 850 }}
        >
          {report.title}
        </h1>
        <p className="type-kicker text-ink-faint mt-3">
          [{date}] -- {wordCount.toLocaleString()} words -- {readTime} min read
        </p>
      </header>

      <article>
        <ReportMarkdown content={report.content} />
      </article>

      {(prevDate || nextDate) && (
        <nav className="rule-row mt-8 flex items-center justify-between gap-4 pt-4">
          {prevDate ? (
            <Link
              href={`/blog/${prevDate}`}
              className="type-kicker inline-flex items-center gap-1.5 text-ink-faint hover:text-primary transition-colors"
            >
              <ChevronLeft data-icon="inline-start" className="size-3.5" />
              [{prevDate}]
            </Link>
          ) : (
            <span />
          )}
          {nextDate ? (
            <Link
              href={`/blog/${nextDate}`}
              className="type-kicker inline-flex items-center gap-1.5 text-ink-faint hover:text-primary transition-colors"
            >
              [{nextDate}]
              <ChevronRight data-icon="inline-end" className="size-3.5" />
            </Link>
          ) : (
            <span />
          )}
        </nav>
      )}
    </div>
  )
}

function extractCitations(content: string) {
  return [...content.matchAll(/https?:\/\/[^\s)]+/g)]
    .map((match) => match[0].replace(/[.,;]+$/, ''))
    .filter((url, index, urls) => urls.indexOf(url) === index)
    .slice(0, 25)
}

function ReportMarkdown({ content }: { content: string }) {
  return (
    <Markdown
      remarkPlugins={[remarkGfm]}
      components={{
        h1: ({ children }) => (
          <h2 className="type-display text-[30px] leading-[1.08] text-ink border-t-[3px] border-ink pt-3 mb-6">{children}</h2>
        ),
        h2: ({ children }) => (
          <h3 className="type-display text-[23px] leading-[1.12] text-ink mt-10 mb-4 border-t border-ink pt-3">{children}</h3>
        ),
        h3: ({ children }) => (
          <h4 className="type-display text-[19px] leading-[1.2] text-ink mt-8 mb-3">{children}</h4>
        ),
        p: ({ children }) => (
          <p className="font-serif text-[17.5px] leading-[1.7] text-ink-prose mb-5">{children}</p>
        ),
        strong: ({ children }) => (
          <strong className="text-ink font-semibold">{children}</strong>
        ),
        a: ({ href, children }) => (
          <a href={href} target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-2 hover:text-ink transition-colors">{children}</a>
        ),
        ul: ({ children }) => (
          <ul className="flex flex-col gap-2 mb-5 ml-4 list-disc marker:text-ink-faint">{children}</ul>
        ),
        ol: ({ children }) => (
          <ol className="flex flex-col gap-2 mb-5 ml-4 list-decimal marker:text-ink-faint">{children}</ol>
        ),
        li: ({ children }) => (
          <li className="font-serif text-[17.5px] leading-[1.7] text-ink-prose">{children}</li>
        ),
        hr: () => (
          <hr className="my-8 mx-auto w-32 border-t border-ink" />
        ),
        blockquote: ({ children }) => (
          <blockquote className="type-display border-t-[3px] border-t-primary border-b border-b-ink px-1 py-4 my-6 text-[21px] leading-[1.3] text-ink [&_p]:mb-0 [&_p]:font-sans [&_p]:font-bold [&_p]:not-italic [&_p]:text-[21px] [&_p]:leading-[1.3] [&_p]:text-ink">{children}</blockquote>
        ),
        code: ({ children }) => (
          <code className="font-mono text-primary bg-accent-wash rounded-[3px] px-1.5 py-0.5 text-[13px]">{children}</code>
        ),
        table: ({ children }) => (
          <div className="overflow-x-auto my-6">
            <table className="w-full text-xs border-collapse">{children}</table>
          </div>
        ),
        th: ({ children }) => (
          <th className="text-left px-3 py-2 border-b-2 border-ink font-mono font-semibold text-ink text-[10px] uppercase tracking-[0.14em]">{children}</th>
        ),
        td: ({ children }) => (
          <td className="px-3 py-2 border-b border-line text-[13px] text-ink-prose">{children}</td>
        ),
      }}
    >
      {content}
    </Markdown>
  )
}
