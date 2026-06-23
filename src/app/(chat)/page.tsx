import type { Metadata } from 'next'
import { ChatInterface } from '@/components/chat/chat-interface'
import { JsonLd } from '@/components/json-ld'
import { absoluteUrl, SITE_DESCRIPTION, SITE_NAME } from '@/lib/site'

export const metadata: Metadata = {
  title: 'AI Research Intelligence',
  description: SITE_DESCRIPTION,
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'MindPattern - AI Research Intelligence',
    description: SITE_DESCRIPTION,
    url: '/',
  },
}

export default function ChatPage() {
  return (
    <>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@graph': [
            {
              '@type': 'WebSite',
              '@id': absoluteUrl('/#website'),
              name: SITE_NAME,
              url: absoluteUrl('/'),
              description: SITE_DESCRIPTION,
              inLanguage: 'en-US',
              potentialAction: {
                '@type': 'SearchAction',
                target: `${absoluteUrl('/explore')}?q={search_term_string}`,
                'query-input': 'required name=search_term_string',
              },
            },
            {
              '@type': 'WebApplication',
              '@id': absoluteUrl('/#app'),
              name: SITE_NAME,
              url: absoluteUrl('/'),
              applicationCategory: 'ResearchApplication',
              operatingSystem: 'Web',
              description: SITE_DESCRIPTION,
            },
          ],
        }}
      />
      <ChatInterface />
    </>
  )
}
