'use client'

import type { UIMessage } from 'ai'
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
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

export function MessageContent({ message }: { message: UIMessage }) {
  return (
    <div className="flex flex-col gap-4">
      {message.parts.map((part, i) => {
        switch (part.type) {
          case 'text':
            return part.text ? (
              <div key={i}>
                <MessageMarkdown text={part.text} />
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

function MessageMarkdown({ text }: { text: string }) {
  return (
    <Markdown
      remarkPlugins={[remarkGfm]}
      components={{
        h1: ({ children }) => (
          <h1 className="text-sm font-bold uppercase tracking-[0.15em] text-foreground border-b border-border pb-2 mb-4">{children}</h1>
        ),
        h2: ({ children }) => (
          <h2 className="text-xs font-bold uppercase tracking-[0.12em] text-foreground mt-6 mb-3 border-l-3 border-primary pl-2">{children}</h2>
        ),
        h3: ({ children }) => (
          <h3 className="text-xs font-bold uppercase tracking-[0.1em] text-foreground mt-5 mb-2">{children}</h3>
        ),
        p: ({ children }) => (
          <p className="text-[13px] leading-[1.75] text-muted-foreground mb-4">{children}</p>
        ),
        strong: ({ children }) => (
          <strong className="text-foreground font-bold">{children}</strong>
        ),
        a: ({ href, children }) => (
          <a href={href} target="_blank" rel="noopener noreferrer" className="text-navy underline underline-offset-2 hover:text-primary transition-colors">{children}</a>
        ),
        ul: ({ children }) => (
          <ul className="flex flex-col gap-1.5 mb-4 ml-4 list-disc marker:text-primary/40">{children}</ul>
        ),
        ol: ({ children }) => (
          <ol className="flex flex-col gap-1.5 mb-4 ml-4 list-decimal marker:text-primary/40">{children}</ol>
        ),
        li: ({ children }) => (
          <li className="text-[13px] leading-[1.75] text-muted-foreground">{children}</li>
        ),
        hr: () => (
          <hr className="my-6 border-t border-border" />
        ),
        blockquote: ({ children }) => (
          <blockquote className="border-l-3 border-olive pl-3 my-4 italic text-muted-foreground/80">{children}</blockquote>
        ),
        code: ({ children }) => (
          <code className="text-primary bg-primary/5 px-1.5 py-0.5 text-xs">{children}</code>
        ),
        table: ({ children }) => (
          <div className="overflow-x-auto my-4">
            <table className="w-full text-xs border-collapse">{children}</table>
          </div>
        ),
        th: ({ children }) => (
          <th className="text-left px-3 py-2 border-b-2 border-border font-bold text-foreground text-[10px] uppercase tracking-wider bg-muted/30">{children}</th>
        ),
        td: ({ children }) => (
          <td className="px-3 py-2 border-b border-border/50 text-[13px]">{children}</td>
        ),
      }}
    >
      {text}
    </Markdown>
  )
}
