'use client'

import { useState } from 'react'
import { topicStyleVars } from '@/lib/topics'
import Link from 'next/link'
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
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-ink-faint" />
        <Input
          type="text"
          placeholder="SEARCH BRIEFINGS..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-10 h-10 font-mono uppercase tracking-[0.08em] md:text-xs"
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
            <Link
              key={report.date}
              href={`/blog/${report.date}`}
              className="flood-row rule-row rise-in group flex items-center justify-between gap-5 px-4 py-5"
              style={{ ...topicStyleVars(null), '--i': i } as React.CSSProperties}
            >
              <div className="min-w-0 flex-1">
                <p className="type-kicker text-(--tc-text)">
                  {report.date} · ~{estimateReadTime(report.size)} min read
                </p>
                <h2 className="type-display text-[25px] leading-[1.04] text-ink mt-2 truncate">
                  {report.title}
                </h2>
              </div>
              <ChevronRight className="size-4 shrink-0 text-ink-faint transition-colors group-hover:text-current group-focus-within:text-current" />
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

function estimateReadTime(size: number): number {
  return Math.max(1, Math.round(size / 5 / 200))
}
