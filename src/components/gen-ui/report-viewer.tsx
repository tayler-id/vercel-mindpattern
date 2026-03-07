'use client'

import { useState } from 'react'
import { motion } from 'motion/react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import type { Report } from '@/lib/types'

export function ReportViewer({ data }: { data: unknown }) {
  const report = data as Report | null
  const [expanded, setExpanded] = useState(false)

  if (!report) {
    return (
      <p className="text-xs text-muted-foreground uppercase tracking-wider font-bold">
        [REPORT NOT FOUND]
      </p>
    )
  }

  const wordCount = report.content.split(/\s+/).length
  const preview = report.content.slice(0, 800)
  const hasMore = report.content.length > 800

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="bg-card border border-border dossier-card overflow-hidden"
    >
      <div className="px-4 py-3 border-b border-border flex items-center justify-between">
        <div>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
            [{report.date}] -- {wordCount.toLocaleString()} words
          </p>
        </div>
        <Link href={`/blog/${report.date}`}>
          <Button variant="outline" size="sm" className="text-[10px] h-7 uppercase tracking-wider font-bold">
            Open full briefing
          </Button>
        </Link>
      </div>
      <div className={`px-4 py-4 ${!expanded && hasMore ? 'max-h-96 overflow-hidden relative' : ''}`}>
        <div className="prose prose-sm max-w-none prose-p:text-muted-foreground prose-a:text-navy prose-headings:text-foreground prose-headings:uppercase prose-headings:tracking-wider prose-strong:text-foreground prose-code:text-primary prose-code:bg-primary/5 prose-code:px-1">
          <Markdown
            remarkPlugins={[remarkGfm]}
            components={{
              a: ({ href, children }) => (
                <a href={href} target="_blank" rel="noopener noreferrer">{children}</a>
              ),
              table: ({ children }) => (
                <div className="overflow-x-auto my-3">
                  <table className="w-full text-xs border-collapse">{children}</table>
                </div>
              ),
              th: ({ children }) => (
                <th className="text-left px-3 py-1.5 border-b border-border font-bold text-foreground text-[10px] uppercase tracking-wider">{children}</th>
              ),
              td: ({ children }) => (
                <td className="px-3 py-1.5 border-b border-border/50">{children}</td>
              ),
            }}
          >
            {expanded ? report.content : preview}
          </Markdown>
        </div>
        {!expanded && hasMore && (
          <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-card to-transparent" />
        )}
      </div>
      {hasMore && !expanded && (
        <div className="px-4 py-3 border-t border-border">
          <Button variant="ghost" size="sm" className="text-[10px] w-full uppercase tracking-wider font-bold" onClick={() => setExpanded(true)}>
            Show full briefing ({wordCount.toLocaleString()} words)
          </Button>
        </div>
      )}
    </motion.div>
  )
}
