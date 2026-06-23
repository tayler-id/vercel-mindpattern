import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/site'

const crawlRules = {
  allow: '/',
  disallow: ['/api/', '/_next/'],
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
      { userAgent: 'CCBot', ...crawlRules },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  }
}
