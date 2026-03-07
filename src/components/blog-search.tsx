'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'motion/react'
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
    <div className="space-y-6">
      <div className="relative">
        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search reports by title..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-10 h-10 rounded-xl bg-card border-border"
        />
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">
          No reports match your search.
        </p>
      ) : (
        <div className="space-y-2">
          {filtered.map((report, i) => (
            <motion.div
              key={report.date}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03, duration: 0.3 }}
            >
              <Link
                href={`/blog/${report.date}`}
                className="flex items-center justify-between bg-card border border-border rounded-xl px-5 py-4 hover:border-primary/30 transition-colors group"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium group-hover:text-primary transition-colors truncate">
                    {report.title}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatDate(report.date)}
                    {' \u00b7 ~'}
                    {estimateReadTime(report.size)} min read
                  </p>
                </div>
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 14 14"
                  fill="none"
                  className="text-muted-foreground group-hover:text-primary shrink-0 ml-4"
                >
                  <path
                    d="M5 3l4 4-4 4"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00')
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

function estimateReadTime(size: number): number {
  return Math.max(1, Math.round(size / 5 / 200))
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      className={className}
    >
      <circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M10.5 10.5L14 14"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  )
}
