import type { MetadataRoute } from 'next'
import { backendFetch } from '@/lib/api'
import { absoluteUrl } from '@/lib/site'
import type { ReportListItem, SiteSitemap } from '@/lib/types'

export const revalidate = 3600

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  let reports: ReportListItem[] = []
  let graph: SiteSitemap | null = null

  try {
    reports = await backendFetch<ReportListItem[]>('/api/reports', {
      user: 'ramsay',
    })
  } catch {
    reports = []
  }

  // No catch. On 2026-08-26 this call was wrapped in `catch { graph = null }`
  // and a slow backend produced a sitemap of five static routes while the
  // corpus held 6,806 stories, 84 entities, 18 sources and 184 briefings.
  // `revalidate = 3600` then pinned that version for an hour, so Google was
  // repeatedly told the site had 187 pages instead of roughly 7,000.
  //
  // Letting the render throw makes Next keep serving the last good sitemap
  // instead of caching a gutted one. Same rule the story pages follow: a
  // failure that cannot be reported honestly must not be cached.
  graph = await backendFetch<SiteSitemap>('/api/site/sitemap', {
    user: 'ramsay',
  })

  if (!graph?.stories?.length) {
    throw new Error(
      `sitemap: backend returned ${graph?.stories?.length ?? 0} stories; ` +
        'refusing to publish a sitemap that de-indexes the corpus',
    )
  }

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: absoluteUrl('/'),
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: absoluteUrl('/briefings'),
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: absoluteUrl('/blog'),
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: absoluteUrl('/explore'),
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: absoluteUrl('/work'),
      lastModified: new Date('2026-08-04'),
      changeFrequency: 'yearly',
      priority: 0.6,
    },
    {
      url: absoluteUrl('/research/agentic-evals'),
      lastModified: new Date('2026-06-23'),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
  ]

  const reportRoutes: MetadataRoute.Sitemap = reports.map((report) => ({
    url: absoluteUrl(`/blog/${report.date}`),
    lastModified: new Date(report.date),
    changeFrequency: 'monthly',
    priority: 0.75,
  }))

  const storyRoutes: MetadataRoute.Sitemap = (graph?.stories ?? []).map((story) => ({
    url: absoluteUrl(`/s/${story.slug}`),
    lastModified: story.issue_date ? new Date(story.issue_date) : undefined,
    changeFrequency: 'weekly',
    priority: 0.8,
  }))

  const briefingRoutes: MetadataRoute.Sitemap = (graph?.briefings ?? []).map((date) => ({
    url: absoluteUrl(`/briefings/${date}`),
    lastModified: new Date(date),
    changeFrequency: 'monthly',
    priority: 0.7,
  }))

  const entityRoutes: MetadataRoute.Sitemap = (graph?.entities ?? []).map((slug) => ({
    url: absoluteUrl(`/e/${slug}`),
    changeFrequency: 'weekly',
    priority: 0.6,
  }))

  const sourceRoutes: MetadataRoute.Sitemap = (graph?.sources ?? []).map((domain) => ({
    url: absoluteUrl(`/source/${domain}`),
    changeFrequency: 'weekly',
    priority: 0.5,
  }))

  return [
    ...staticRoutes,
    ...reportRoutes,
    ...storyRoutes,
    ...briefingRoutes,
    ...entityRoutes,
    ...sourceRoutes,
  ]
}
