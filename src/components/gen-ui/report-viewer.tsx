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
      <div className={`px-4 py-4 report-article ${!expanded && hasMore ? 'max-h-96 overflow-hidden relative' : ''}`}>
          <Markdown
            remarkPlugins={[remarkGfm]}
            components={{
              h1: ({ children }) => (
                <h1 className="text-base font-bold uppercase tracking-[0.15em] text-foreground border-b-2 border-primary/30 pb-3 mb-6">{children}</h1>
              ),
              h2: ({ children }) => (
                <h2 className="text-sm font-bold uppercase tracking-[0.15em] text-foreground mt-8 mb-3 border-l-3 border-primary pl-3">{children}</h2>
              ),
              h3: ({ children }) => (
                <h3 className="text-xs font-bold uppercase tracking-[0.12em] text-foreground mt-6 mb-2">{children}</h3>
              ),
              p: ({ children }) => (
                <p className="text-[13px] leading-[1.8] text-muted-foreground mb-5">{children}</p>
              ),
              strong: ({ children }) => (
                <strong className="text-foreground font-bold">{children}</strong>
              ),
              a: ({ href, children }) => (
                <a href={href} target="_blank" rel="noopener noreferrer" className="text-navy underline underline-offset-2 hover:text-primary transition-colors">{children}</a>
              ),
              ul: ({ children }) => (
                <ul className="flex flex-col gap-2 mb-5 ml-4 list-disc marker:text-primary/40">{children}</ul>
              ),
              ol: ({ children }) => (
                <ol className="flex flex-col gap-2 mb-5 ml-4 list-decimal marker:text-primary/40">{children}</ol>
              ),
              li: ({ children }) => (
                <li className="text-[13px] leading-[1.8] text-muted-foreground">{children}</li>
              ),
              hr: () => (
                <hr className="my-8 border-t border-border" />
              ),
              blockquote: ({ children }) => (
                <blockquote className="border-l-3 border-olive pl-4 my-6 italic text-muted-foreground/80">{children}</blockquote>
              ),
              code: ({ children }) => (
                <code className="text-primary bg-primary/5 px-1.5 py-0.5 text-xs">{children}</code>
              ),
              table: ({ children }) => (
                <div className="overflow-x-auto my-6">
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
            {expanded ? report.content : preview}
          </Markdown>
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
