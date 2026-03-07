import { backendFetch } from '@/lib/api'
import { BlogSearch } from '@/components/blog-search'
import type { ReportListItem } from '@/lib/types'

export const revalidate = 60

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
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Newsletter Archive
        </h1>
        <p className="text-muted-foreground mt-1">
          Daily AI research intelligence reports
        </p>
      </div>

      {error || reports.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-12 h-12 rounded-xl bg-muted/50 flex items-center justify-center mb-4">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              className="text-muted-foreground"
            >
              <path
                d="M4 6h16M4 12h16M4 18h10"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </div>
          <p className="text-sm text-muted-foreground">
            No reports available yet.
          </p>
          <p className="text-xs text-muted-foreground/60 mt-1">
            Reports will appear here once the research pipeline runs.
          </p>
        </div>
      ) : (
        <BlogSearch reports={reports} />
      )}
    </div>
  )
}
