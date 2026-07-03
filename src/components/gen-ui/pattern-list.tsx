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
            className="rule-row px-4 py-5 transition-colors hover:bg-spine"
          >
            <div className="flex items-start justify-between gap-5 mb-2">
              <h4 className="type-display text-[19px] leading-[1.1] text-ink">{p.theme}</h4>
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="tag-chip">
                  {p.recurrence_count}x
                </span>
                <span className="inline-flex items-center rounded-full bg-panel px-3 py-1 font-mono text-[10.5px] leading-none font-semibold uppercase tracking-[0.12em] text-ink">
                  {daySpan}d
                </span>
              </div>
            </div>
            {p.description && (
              <p className="text-[14px] text-ink-soft leading-[1.55] mb-3">{p.description}</p>
            )}
            <div className="flex items-center gap-2">
              <div className="flex-1 h-1 rounded-full bg-panel overflow-hidden">
                <motion.div
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: strength }}
                  transition={{ delay: 0.2 + i * 0.04, duration: 0.5 }}
                  className="h-full w-full origin-left rounded-full bg-chart-2"
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
