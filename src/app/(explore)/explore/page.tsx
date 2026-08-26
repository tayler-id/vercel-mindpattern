import type { Metadata } from 'next'
import { ExploreTabs } from '@/components/explore/explore-tabs'
import { JsonLd } from '@/components/json-ld'
import { absoluteUrl, SITE_NAME } from '@/lib/site'

const OG_TITLE = 'AI Research Archive'
const OG_DESCRIPTION =
  'Browse findings, sources, patterns, skills, and system health from the MindPattern AI research database.'

/**
 * A page-level openGraph object replaces the root's rather than merging into
 * it, which took the site card with it and left /explore unfurling with no
 * image. The archive has no card generator of its own, so it shares the static
 * site card.
 */
const OG_IMAGE = {
  url: '/opengraph-image',
  width: 1200,
  height: 630,
  type: 'image/png',
  alt: 'MindPattern AI research archive',
}

export const metadata: Metadata = {
  title: OG_TITLE,
  description:
    'Browse the MindPattern AI research archive: findings, sources, recurring patterns, developer skills, system health, and the agent roster behind each daily briefing.',
  alternates: {
    canonical: '/explore',
  },
  openGraph: {
    type: 'website',
    siteName: SITE_NAME,
    title: OG_TITLE,
    description: OG_DESCRIPTION,
    url: '/explore',
    images: [OG_IMAGE],
  },
  twitter: {
    card: 'summary_large_image',
    title: OG_TITLE,
    description: OG_DESCRIPTION,
    images: [OG_IMAGE],
  },
}

export default function ExplorePage() {
  return (
    <div className="max-w-5xl mx-auto px-5 py-8 md:px-8">
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'Dataset',
          '@id': absoluteUrl('/explore#dataset'),
          name: 'MindPattern AI Research Archive',
          url: absoluteUrl('/explore'),
          description: metadata.description,
          creator: {
            '@type': 'Organization',
            name: SITE_NAME,
            url: absoluteUrl('/'),
          },
          keywords: [
            'AI research',
            'AI agents',
            'developer tools',
            'research sources',
            'AI patterns',
          ],
        }}
      />
      <div className="mb-6 border-t-[3px] border-ink pt-3">
        <p className="type-kicker text-primary">
          Browse the research database
        </p>
        <h1
          className="type-display uppercase text-[clamp(40px,6vw,68px)] leading-[0.95] text-ink mt-2"
          style={{ fontVariationSettings: '"wdth" 118', fontWeight: 850 }}
        >
          AI Research Archive
        </h1>
      </div>
      <ExploreTabs />
    </div>
  )
}
