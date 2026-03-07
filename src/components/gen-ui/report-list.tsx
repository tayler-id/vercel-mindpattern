'use client'

import Link from 'next/link'
import { motion } from 'motion/react'
import type { ReportListItem } from '@/lib/types'

export function ReportList({ data }: { data: unknown }) {
  const reports = data as ReportListItem[]
  if (!reports?.length) return <p className="text-sm text-muted-foreground">No reports found.</p>

  return (
    <div className="space-y-1.5">
      {reports.map((r, i) => (
        <motion.div
          key={r.date}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.03 }}
        >
          <Link
            href={`/blog/${r.date}`}
            className="flex items-center justify-between bg-card border border-border rounded-xl px-4 py-3 hover:border-primary/30 transition-colors group"
          >
            <div>
              <p className="text-sm font-medium group-hover:text-primary transition-colors">{r.title}</p>
              <p className="text-[11px] text-muted-foreground">
                {new Date(r.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                {' · ~'}{Math.round(r.size / 5 / 200)} min read
              </p>
            </div>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="text-muted-foreground group-hover:text-primary shrink-0">
              <path d="M5 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </Link>
        </motion.div>
      ))}
    </div>
  )
}
