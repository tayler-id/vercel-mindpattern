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
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-ink-faint" />
        <Input
          type="text"
          placeholder="SEARCH BRIEFINGS..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-10 h-10 font-mono uppercase tracking-[0.08em] text-xs placeholder:text-ink-faint"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="rule-row p-10 text-center">
          <p className="type-kicker text-ink-soft">
            [NO MATCHING BRIEFINGS]
          </p>
        </div>
      ) : (
        <div className="flex flex-col">
          {filtered.map((report, i) => (
            <motion.div
              key={report.date}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03, duration: 0.3 }}
            >
              <Link
                href={`/blog/${report.date}`}
                className="rule-row group flex items-center justify-between gap-4 py-4 transition-colors hover:bg-spine"
              >
                <div className="min-w-0 flex-1">
                  <p className="type-display text-[19px] font-[560] text-ink truncate group-hover:underline">
                    {report.title}
                  </p>
                  <p className="type-kicker text-ink-faint mt-1">
                    [{report.date}] -- ~{estimateReadTime(report.size)} min read
                  </p>
                </div>
                <ChevronRight className="size-4 text-ink-faint group-hover:text-primary shrink-0" />
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
