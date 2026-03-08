'use client'

import type { UIMessage } from 'ai'
import { Streamdown } from 'streamdown'
import { code } from '@streamdown/code'
import { FindingCards } from '@/components/gen-ui/finding-cards'
import { StatsOverview } from '@/components/gen-ui/stats-overview'
import { PatternList } from '@/components/gen-ui/pattern-list'
import { SourceTable } from '@/components/gen-ui/source-table'
import { SkillCards } from '@/components/gen-ui/skill-cards'
import { HealthDashboard } from '@/components/gen-ui/health-dashboard'
import { ReportList } from '@/components/gen-ui/report-list'
import { ReportViewer } from '@/components/gen-ui/report-viewer'
import { ReportSearchResults } from '@/components/gen-ui/report-search-results'
import { Skeleton } from '@/components/ui/skeleton'

const TOOL_COMPONENTS: Record<string, React.ComponentType<{ data: unknown }>> = {
  search_findings: FindingCards,
  list_findings: FindingCards,
  get_stats: StatsOverview,
  get_patterns: PatternList,
  get_sources: SourceTable,
  search_skills: SkillCards,
  list_skills: SkillCards,
  get_health: HealthDashboard,
  list_reports: ReportList,
  read_report: ReportViewer,
  search_reports: ReportSearchResults,
}

const streamdownPlugins = { code }

export function MessageContent({ message, isStreaming = false }: { message: UIMessage; isStreaming?: boolean }) {
  return (
    <div className="flex flex-col gap-4">
      {message.parts.map((part, i) => {
        switch (part.type) {
          case 'text':
            return part.text ? (
              <div key={i} className="streamdown-wire-room">
                <Streamdown
                  isAnimating={isStreaming}
                  plugins={streamdownPlugins}
                >
                  {part.text}
                </Streamdown>
              </div>
            ) : null

          default: {
            let toolName: string | null = null
            if (part.type === 'dynamic-tool') {
              toolName = (part as unknown as { toolName: string }).toolName
            } else if (part.type.startsWith('tool-')) {
              toolName = part.type.slice(5)
            }
            if (!toolName) return null

            const Component = TOOL_COMPONENTS[toolName]
            if (!Component) return null

            const toolPart = part as unknown as {
              state: string
              output?: unknown
              toolCallId: string
            }

            if (toolPart.state === 'output-available') {
              return <Component key={i} data={toolPart.output} />
            }

            return (
              <div key={i} className="flex flex-col gap-2">
                <div className="text-[10px] text-muted-foreground flex items-center gap-2 uppercase tracking-wider font-bold">
                  <span className="typewriter-cursor">_</span>
                  Querying {toolName.replace(/_/g, ' ')}...
                </div>
                <Skeleton className="h-32 w-full" />
              </div>
            )
          }
        }
      })}
    </div>
  )
}
