import { backendFetch } from '@/lib/api'
import { ContentHub } from '@/components/content-hub'
import { Header } from '@/components/header'
import type { Finding, Pattern, ReportListItem } from '@/lib/types'

export const revalidate = 60

export default async function HomePage() {
  let reports: ReportListItem[] = []
  let findings: Finding[] = []
  let patterns: Pattern[] = []

  try {
    ;[reports, findings, patterns] = await Promise.all([
      backendFetch<ReportListItem[]>('/api/reports', { user: 'ramsay' }),
      backendFetch<Finding[]>('/api/findings', { limit: '200' }),
      backendFetch<Pattern[]>('/api/patterns'),
    ])
  } catch {
    // Data may not be available — render empty state
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <ContentHub
          reports={reports}
          findings={findings}
          patterns={patterns}
          totalFindings={1419}
        />
      </main>
    </div>
  )
}
