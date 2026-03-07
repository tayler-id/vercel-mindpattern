'use client'

import { motion } from 'motion/react'
import type { Pattern } from '@/lib/types'

export function PatternList({ data, limit }: { data: unknown; limit?: number }) {
  const patterns = data as Pattern[]
  if (!patterns?.length) return <p className="text-sm text-muted-foreground">No patterns tracked yet.</p>

  const displayed = limit ? patterns.slice(0, limit) : patterns

  return (
    <div className="space-y-2">
      {displayed.map((p, i) => (
        <motion.div
          key={p.theme}
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.04 }}
          className="bg-card border border-border rounded-xl p-4"
        >
          <div className="flex items-center justify-between mb-1">
            <h4 className="text-sm font-medium">{p.theme}</h4>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
              {p.recurrence_count}x
            </span>
          </div>
          {p.description && (
            <p className="text-xs text-muted-foreground leading-relaxed">{p.description}</p>
          )}
          <div className="text-[11px] text-muted-foreground mt-2">
            {p.first_seen} — {p.last_seen}
          </div>
        </motion.div>
      ))}
    </div>
  )
}
