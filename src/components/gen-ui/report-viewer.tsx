'use client'

import { useState } from 'react'
import { motion } from 'motion/react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import type { Report } from '@/lib/types'

export function ReportViewer({ data }: { data: unknown }) {
  const report = data as Report | null
  const [expanded, setExpanded] = useState(false)

  if (!report) return <p className="text-sm text-muted-foreground">Report not found.</p>

  const wordCount = report.content.split(/\s+/).length
  const preview = report.content.slice(0, 800)
  const hasMore = report.content.length > 800

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="bg-card border border-border rounded-xl overflow-hidden"
    >
      <div className="px-4 py-3 border-b border-border flex items-center justify-between">
        <div>
          <p className="text-xs text-muted-foreground">
            {new Date(report.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            {' · '}{wordCount.toLocaleString()} words
          </p>
        </div>
        <Link href={`/blog/${report.date}`}>
          <Button variant="outline" size="sm" className="text-xs h-7">
            Open full report
          </Button>
        </Link>
      </div>
      <div className={`px-4 py-4 ${!expanded && hasMore ? 'max-h-96 overflow-hidden relative' : ''}`}>
        <div className="prose prose-invert prose-sm max-w-none prose-p:text-muted-foreground prose-a:text-primary prose-headings:text-foreground prose-strong:text-foreground">
          <ReportMarkdown content={expanded ? report.content : preview} />
        </div>
        {!expanded && hasMore && (
          <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-card to-transparent" />
        )}
      </div>
      {hasMore && !expanded && (
        <div className="px-4 py-3 border-t border-border">
          <Button variant="ghost" size="sm" className="text-xs w-full" onClick={() => setExpanded(true)}>
            Show full report ({wordCount.toLocaleString()} words)
          </Button>
        </div>
      )}
    </motion.div>
  )
}

function ReportMarkdown({ content }: { content: string }) {
  const html = content
    .replace(/^### (.*$)/gm, '<h3>$1</h3>')
    .replace(/^## (.*$)/gm, '<h2>$1</h2>')
    .replace(/^# (.*$)/gm, '<h1>$1</h1>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/^---$/gm, '<hr/>')
    .replace(/^- (.*$)/gm, '<li>$1</li>')
    .replace(/^(?!<[hlu]|<li|<hr)(.*\S.*)$/gm, '<p>$1</p>')
    .replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>')

  return <div dangerouslySetInnerHTML={{ __html: html }} />
}
