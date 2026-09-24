import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/site'

const crawlRules = {
  allow: '/',
  disallow: ['/api/', '/_next/'],
  // Uncapped AI-crawler sweeps of the full-archive sitemap were a real
  // outage vector (thundering herd on the backend). Most bots honor this.
  crawlDelay: 10,
}

// Crawlers that collect model-training data. Google-Extended and
// Applebot-Extended are opt-out tokens only: Googlebot and Applebot keep
// indexing the site for search. src/middleware.ts refuses the rest with a 403.
const TRAINING_CRAWLERS = [
  'GPTBot',
  'ClaudeBot',
  'CCBot',
  'Google-Extended',
  'Applebot-Extended',
  'meta-externalagent',
  'Bytespider',
  'Amazonbot',
]

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: '*', ...crawlRules },
      // Agents that fetch a page to answer a person, or index it for search.
      { userAgent: 'ChatGPT-User', ...crawlRules },
      { userAgent: 'PerplexityBot', ...crawlRules },
      { userAgent: 'Claude-User', ...crawlRules },
      { userAgent: 'Claude-SearchBot', ...crawlRules },
      { userAgent: 'OAI-SearchBot', ...crawlRules },
      { userAgent: 'Perplexity-User', ...crawlRules },
      { userAgent: 'DuckAssistBot', ...crawlRules },
      { userAgent: 'MistralAI-User', ...crawlRules },
      ...TRAINING_CRAWLERS.map((userAgent) => ({ userAgent, disallow: '/' })),
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  }
}
