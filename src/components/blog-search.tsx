'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'motion/react'
import { Search, ChevronRight } from 'lucide-react'
import { Input } from '@/components/ui/input'
import type { ReportListItem } from '@/lib/types'

export function BlogSearch({ reports }: { reports: ReportListItem[] }) {
  const [query, setQuery] = useState('')

  const filtered = query.trim()
    ? reports.filter((r) =>
        r.title.toLowerCase().includes(query.toLowerCase())
      )
    : reports

  return (
    <div className="flex flex-col gap-6">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="text"
          placeholder="SEARCH BRIEFINGS..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-10 h-10 bg-card border-border uppercase tracking-wider text-xs placeholder:text-muted-foreground/50"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="bg-card border border-border dossier-card p-10 text-center">
          <p className="text-xs text-muted-foreground uppercase tracking-[0.15em] font-bold">
            [NO MATCHING BRIEFINGS]
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {filtered.map((report, i) => (
            <motion.div
              key={report.date}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03, duration: 0.3 }}
            >
              <Link
                href={`/blog/${report.date}`}
                className="flex items-center justify-between bg-card border border-border dossier-card px-5 py-4 hover:border-primary/30 transition-colors group"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold group-hover:text-navy transition-colors truncate">
                    {report.title}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-1 uppercase tracking-wider">
                    [{report.date}] -- ~{estimateReadTime(report.size)} min read
                  </p>
                </div>
                <ChevronRight className="text-muted-foreground group-hover:text-navy shrink-0 ml-4" />
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}

function estimateReadTime(size: number): number {
  return Math.max(1, Math.round(size / 5 / 200))
}
