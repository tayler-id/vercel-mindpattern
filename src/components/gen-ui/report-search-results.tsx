'use client'

import Link from 'next/link'
import { motion } from 'motion/react'
import type { ReportSearchResult } from '@/lib/types'

export function ReportSearchResults({ data }: { data: unknown }) {
  const results = data as ReportSearchResult[]
  if (!results?.length) {
    return (
      <p className="text-xs text-muted-foreground uppercase tracking-wider font-bold">
        [NO MATCHING BRIEFINGS]
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      {results.map((r, i) => (
        <motion.div
          key={`${r.date}-${i}`}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.04 }}
        >
          <Link
            href={`/blog/${r.date}`}
            className="block bg-card border border-border dossier-card p-4 hover:border-primary/30 transition-colors group"
          >
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-bold group-hover:text-navy transition-colors">{r.title}</h4>
              <span className="text-[10px] text-muted-foreground shrink-0 ml-3 uppercase tracking-wider">[{r.date}]</span>
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-3">{r.excerpt}</p>
          </Link>
        </motion.div>
      ))}
    </div>
  )
}
