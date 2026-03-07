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
    <div className="max-w-3xl mx-auto px-4 py-8 flex flex-col gap-8">
      <div>
        <h1 className="text-sm font-bold uppercase tracking-[0.2em]">
          Briefing Archive
        </h1>
        <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">
          Daily AI research intelligence reports
        </p>
      </div>

      {error || reports.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="border-2 border-border dossier-card size-12 flex items-center justify-center mb-4">
            <span className="text-muted-foreground text-lg font-bold">?</span>
          </div>
          <p className="text-xs text-muted-foreground uppercase tracking-[0.15em] font-bold">
            [NO BRIEFINGS ON FILE]
          </p>
          <p className="text-[10px] text-muted-foreground/60 mt-1 uppercase tracking-wider">
            Reports will appear here once the research pipeline runs.
          </p>
        </div>
      ) : (
        <BlogSearch reports={reports} />
      )}
    </div>
  )
}
