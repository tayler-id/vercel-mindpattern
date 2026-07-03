import type { Metadata } from 'next'
import { backendFetch } from '@/lib/api'
import { BlogSearch } from '@/components/blog-search'
import { JsonLd } from '@/components/json-ld'
import { NewsletterSignup } from '@/components/newsletter-signup'
import { absoluteUrl, SITE_DESCRIPTION, SITE_NAME } from '@/lib/site'
import type { ReportListItem } from '@/lib/types'

export const revalidate = 60

export const metadata: Metadata = {
  title: 'Daily AI Research Briefing Archive',
  description:
    'Search the MindPattern archive of daily AI research intelligence briefings covering AI news, agent frameworks, developer tools, papers, sources, and recurring patterns.',
  alternates: {
    canonical: '/blog',
  },
  openGraph: {
    title: 'Daily AI Research Briefing Archive',
    description:
      'Search daily AI research intelligence briefings from MindPattern.',
    url: '/blog',
  },
}

export default async function BlogPage() {
  let reports: ReportListItem[] = []
  let error = false

  try {
    reports = await backendFetch<ReportListItem[]>('/api/reports', {
      user: 'ramsay',
    })
  } catch {
    error = true
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 flex flex-col gap-8">
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'CollectionPage',
          '@id': absoluteUrl('/blog#archive'),
          name: 'Daily AI Research Briefing Archive',
          url: absoluteUrl('/blog'),
          description: metadata.description,
          isPartOf: {
            '@type': 'WebSite',
            name: SITE_NAME,
            url: absoluteUrl('/'),
            description: SITE_DESCRIPTION,
          },
        }}
      />

      <div className="rule-scotch pt-3">
        <p className="type-kicker text-primary">
          Daily AI research intelligence reports
        </p>
        <h1 className="type-display text-[32px] font-[560] text-ink mt-1 sm:text-[40px]">
          AI Research Briefing Archive
        </h1>
      </div>

      <div className="border border-ink bg-surface p-4">
        <p className="type-kicker text-ink mb-1">
          Get the briefing delivered
        </p>
        <p className="font-serif text-[13px] text-ink-soft mb-3">
          Daily AI research intelligence. 13 agents, 8 sources, one briefing.
        </p>
        <NewsletterSignup />
      </div>

      {error || reports.length === 0 ? (
        <div className="rule-row flex flex-col items-center justify-center py-16 text-center">
          <span className="numeral-ghost text-[44px] mb-4" aria-hidden>?</span>
          <p className="type-kicker text-ink-soft">
            [NO BRIEFINGS ON FILE]
          </p>
          <p className="type-kicker text-ink-faint mt-1">
            Reports will appear here once the research pipeline runs.
          </p>
        </div>
      ) : (
        <BlogSearch reports={reports} />
      )}
    </div>
  )
}
