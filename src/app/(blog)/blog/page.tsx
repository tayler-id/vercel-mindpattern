import type { Metadata } from 'next'
import { backendFetch } from '@/lib/api'
import { BlogSearch } from '@/components/blog-search'
import { JsonLd } from '@/components/json-ld'
import { NewsletterSignup } from '@/components/newsletter-signup'
import { absoluteUrl, SITE_DESCRIPTION, SITE_NAME } from '@/lib/site'
import type { ReportListItem } from '@/lib/types'

export const revalidate = 300

const OG_TITLE = 'Daily AI Research Briefing Archive'
const OG_DESCRIPTION = 'Search daily AI research intelligence briefings from MindPattern.'

/**
 * A page-level openGraph object replaces the root's rather than merging into
 * it, which took the site card with it and left /blog unfurling with no image.
 * `/og/briefing/[date]` renders one issue, so the archive index shares the
 * static site card instead.
 */
const OG_IMAGE = {
  url: '/opengraph-image',
  width: 1200,
  height: 630,
  type: 'image/png',
  alt: 'MindPattern daily AI research briefing archive',
}

export const metadata: Metadata = {
  title: OG_TITLE,
  description:
    'Search the MindPattern archive of daily AI research intelligence briefings covering AI news, agent frameworks, developer tools, papers, sources, and recurring patterns.',
  alternates: {
    canonical: '/blog',
  },
  openGraph: {
    type: 'website',
    siteName: SITE_NAME,
    title: OG_TITLE,
    description: OG_DESCRIPTION,
    url: '/blog',
    images: [OG_IMAGE],
  },
  twitter: {
    card: 'summary_large_image',
    title: OG_TITLE,
    description: OG_DESCRIPTION,
    images: [OG_IMAGE],
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
    <div className="max-w-[720px] mx-auto px-5 py-8 md:px-8 flex flex-col gap-8">
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

      <div className="border-t-[3px] border-ink pt-3">
        <p className="type-kicker text-primary">
          Daily AI research intelligence reports
        </p>
        <h1
          className="type-display uppercase text-[clamp(40px,6vw,68px)] leading-[0.95] text-ink mt-2"
          style={{ fontVariationSettings: '"wdth" 118', fontWeight: 850 }}
        >
          AI Research Briefing Archive
        </h1>
      </div>

      <div className="rounded-[20px] bg-primary p-5 text-white sm:p-6">
        <p className="type-kicker text-white">
          Get the briefing delivered
        </p>
        <p className="text-[14px] text-white/90 mt-1 mb-4">
          Daily AI research intelligence. 13 agents, 8 sources, one briefing.
        </p>
        <NewsletterSignup variant="onAccent" />
      </div>

      {error || reports.length === 0 ? (
        <div className="rule-row flex flex-col items-center justify-center py-16 text-center">
          <span className="num-outline text-[44px] text-ink-faint mb-4" aria-hidden>?</span>
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
