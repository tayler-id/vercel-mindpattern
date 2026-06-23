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

      <div>
        <h1 className="text-sm font-bold uppercase tracking-[0.2em]">
          AI Research Briefing Archive
        </h1>
        <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">
          Daily AI research intelligence reports
        </p>
      </div>

      <div className="border border-border dossier-card p-4">
        <p className="text-xs font-bold uppercase tracking-[0.15em] mb-1">
          Get the briefing delivered
        </p>
        <p className="text-[10px] text-muted-foreground mb-3">
          Daily AI research intelligence — 13 agents, 8 sources, one briefing.
        </p>
        <NewsletterSignup />
      </div>

      {error || reports.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="border-2 border-border dossier-card size-12 flex items-center justify-center mb-4">
            <span className="text-muted-foreground text-lg font-bold">?</span>
          </div>
          <p className="text-xs text-muted-foreground uppercase tracking-[0.15em] font-bold">
            [NO BRIEFINGS ON FILE]
          </p>
          <p className="text-[10px] text-muted-foreground/60 mt-1 uppercase tracking-wider">
            Reports will appear here once the research pipeline runs.
          </p>
        </div>
      ) : (
        <BlogSearch reports={reports} />
      )}
    </div>
  )
}
