import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/site'

const crawlRules = {
  allow: '/',
  disallow: ['/api/', '/_next/'],
  // Uncapped AI-crawler sweeps of the full-archive sitemap were a real
  // outage vector (thundering herd on the backend). Most bots honor this.
  crawlDelay: 10,
}

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: '*', ...crawlRules },
      { userAgent: 'GPTBot', ...crawlRules },
      { userAgent: 'ChatGPT-User', ...crawlRules },
      { userAgent: 'Google-Extended', ...crawlRules },
      { userAgent: 'PerplexityBot', ...crawlRules },
      { userAgent: 'ClaudeBot', ...crawlRules },
      { userAgent: 'Claude-User', ...crawlRules },
      { userAgent: 'Claude-SearchBot', ...crawlRules },
      { userAgent: 'OAI-SearchBot', ...crawlRules },
      { userAgent: 'Perplexity-User', ...crawlRules },
      { userAgent: 'DuckAssistBot', ...crawlRules },
      { userAgent: 'Amazonbot', ...crawlRules },
      { userAgent: 'Applebot-Extended', ...crawlRules },
      { userAgent: 'meta-externalagent', ...crawlRules },
      { userAgent: 'CCBot', ...crawlRules },
      { userAgent: 'MistralAI-User', ...crawlRules },
      { userAgent: 'CCBot', ...crawlRules },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  }
}
