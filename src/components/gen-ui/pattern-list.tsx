'use client'

import { motion } from 'motion/react'
import type { Pattern } from '@/lib/types'

export function PatternList({ data, limit }: { data: unknown; limit?: number }) {
  const patterns = data as Pattern[]
  if (!patterns?.length) {
    return (
      <p className="text-xs text-muted-foreground uppercase tracking-wider font-bold">
        [NO PATTERNS DETECTED]
      </p>
    )
  }

  const displayed = limit ? patterns.slice(0, limit) : patterns
  const maxRecurrence = Math.max(...displayed.map((p) => p.recurrence_count), 1)

  return (
    <div className="flex flex-col gap-2">
      {displayed.map((p, i) => {
        const strength = p.recurrence_count / maxRecurrence
        const daySpan = Math.max(1, Math.round(
          (new Date(p.last_seen).getTime() - new Date(p.first_seen).getTime()) / (1000 * 60 * 60 * 24)
        ))

        return (
          <motion.div
            key={p.theme}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.04 }}
            className="bg-card border border-border dossier-card p-4 hover:border-primary/30 transition-colors"
          >
            <div className="flex items-start justify-between gap-3 mb-2">
              <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">{p.theme}</h4>
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="text-[10px] px-2 py-0.5 border border-primary/20 bg-primary/10 text-primary font-bold uppercase tracking-wider">
                  {p.recurrence_count}x
                </span>
                <span className="text-[10px] px-2 py-0.5 border border-border bg-muted text-muted-foreground uppercase tracking-wider">
                  {daySpan}d
                </span>
              </div>
            </div>
            {p.description && (
              <p className="text-[11px] text-muted-foreground leading-relaxed mb-3">{p.description}</p>
            )}
            <div className="flex items-center gap-2">
              <div className="flex-1 h-1 bg-muted overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${strength * 100}%` }}
                  transition={{ delay: 0.2 + i * 0.04, duration: 0.5 }}
                  className="h-full bg-olive"
                />
              </div>
              <span className="text-[10px] text-muted-foreground shrink-0 uppercase tracking-wider">
                {p.first_seen.slice(5)} -- {p.last_seen.slice(5)}
              </span>
            </div>
          </motion.div>
        )
      })}
    </div>
  )
}
