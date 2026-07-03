'use client'

import { motion } from 'motion/react'
import type { Pattern } from '@/lib/types'

export function PatternList({ data, limit }: { data: unknown; limit?: number }) {
  const patterns = data as Pattern[]
  if (!patterns?.length) {
    return (
      <p className="type-kicker text-ink-soft">
        [NO PATTERNS DETECTED]
      </p>
    )
  }

  const displayed = limit ? patterns.slice(0, limit) : patterns
  const maxRecurrence = Math.max(...displayed.map((p) => p.recurrence_count), 1)

  return (
    <div className="flex flex-col">
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
            className="rule-row py-4 transition-colors hover:bg-spine"
          >
            <div className="flex items-start justify-between gap-3 mb-2">
              <h4 className="type-display text-[17px] font-[560] text-ink">{p.theme}</h4>
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="font-mono text-[10px] px-2 py-0.5 border border-primary/20 bg-accent-wash text-primary font-semibold uppercase tracking-wider">
                  {p.recurrence_count}x
                </span>
                <span className="font-mono text-[10px] px-2 py-0.5 border border-line bg-panel text-ink-soft uppercase tracking-wider">
                  {daySpan}d
                </span>
              </div>
            </div>
            {p.description && (
              <p className="font-serif text-[14px] text-ink-soft leading-relaxed mb-3">{p.description}</p>
            )}
            <div className="flex items-center gap-2">
              <div className="flex-1 h-1 bg-panel overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${strength * 100}%` }}
                  transition={{ delay: 0.2 + i * 0.04, duration: 0.5 }}
                  className="h-full bg-chart-2"
                />
              </div>
              <span className="type-kicker text-ink-faint shrink-0">
                {p.first_seen.slice(5)} -- {p.last_seen.slice(5)}
              </span>
            </div>
          </motion.div>
        )
      })}
    </div>
  )
}
