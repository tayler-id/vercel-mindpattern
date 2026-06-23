import type { MetadataRoute } from 'next'
import { backendFetch } from '@/lib/api'
import { absoluteUrl } from '@/lib/site'
import type { ReportListItem } from '@/lib/types'

export const revalidate = 3600

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  let reports: ReportListItem[] = []

  try {
    reports = await backendFetch<ReportListItem[]>('/api/reports', {
      user: 'ramsay',
    })
  } catch {
    reports = []
  }

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: absoluteUrl('/'),
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
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

  return [...staticRoutes, ...reportRoutes]
}
