'use client'

import Link from 'next/link'
import { motion } from 'motion/react'
import { ChevronRight } from 'lucide-react'
import type { ReportListItem } from '@/lib/types'

export function ReportList({ data }: { data: unknown }) {
  const reports = data as ReportListItem[]
  if (!reports?.length) {
    return (
      <p className="text-xs text-muted-foreground uppercase tracking-wider font-bold">
        [NO BRIEFINGS ON FILE]
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-1.5">
      {reports.map((r, i) => (
        <motion.div
          key={r.date}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.03 }}
        >
          <Link
            href={`/blog/${r.date}`}
            className="flex items-center justify-between bg-card border border-border dossier-card px-4 py-3 hover:border-primary/30 transition-colors group"
          >
            <div>
              <p className="text-xs font-bold group-hover:text-navy transition-colors">{r.title}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-0.5">
                [{r.date}] -- ~{Math.round(r.size / 5 / 200)} min read
              </p>
            </div>
            <ChevronRight className="text-muted-foreground group-hover:text-navy shrink-0" />
          </Link>
        </motion.div>
      ))}
    </div>
  )
}
