import type { Metadata } from 'next'
import { ExploreTabs } from '@/components/explore/explore-tabs'
import { JsonLd } from '@/components/json-ld'
import { absoluteUrl, SITE_NAME } from '@/lib/site'

export const metadata: Metadata = {
  title: 'AI Research Archive',
  description:
    'Browse the MindPattern AI research archive: findings, sources, recurring patterns, developer skills, system health, and the agent roster behind each daily briefing.',
  alternates: {
    canonical: '/explore',
  },
  openGraph: {
    title: 'AI Research Archive',
    description:
      'Browse findings, sources, patterns, skills, and system health from the MindPattern AI research database.',
    url: '/explore',
  },
}

export default function ExplorePage() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
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
      <div className="rule-scotch mb-6 pt-3">
        <p className="type-kicker text-primary">
          Browse the research database
        </p>
        <h1 className="type-display text-[32px] font-[560] text-ink mt-1 sm:text-[40px]">AI Research Archive</h1>
      </div>
      <ExploreTabs />
    </div>
  )
}
