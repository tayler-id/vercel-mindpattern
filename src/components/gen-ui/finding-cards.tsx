'use client'

import { motion } from 'motion/react'
import { Badge } from '@/components/ui/badge'
import { IMPORTANCE_COLORS } from '@/lib/constants'
import type { Finding } from '@/lib/types'

export function FindingCards({ data, limit }: { data: unknown; limit?: number }) {
  const findings = data as Finding[]
  if (!findings?.length) {
    return (
      <p className="type-kicker text-ink-soft">
        [NO FINDINGS ON FILE]
      </p>
    )
  }

  const displayed = limit ? findings.slice(0, limit) : findings

  return (
    <div className="flex flex-col">
      {displayed.map((f, i) => (
        <motion.div
          key={`${f.id}-${i}`}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: Math.min(i * 0.03, 0.5) }}
          className="rule-row py-4 transition-colors hover:bg-spine"
        >
          <div className="flex items-start justify-between gap-3 mb-2">
            <h4 className="type-display text-[17px] font-[560] text-ink leading-snug">
              {f.source_url ? (
                <a href={f.source_url} target="_blank" rel="noopener noreferrer" className="hover:underline">
                  {f.title}
                </a>
              ) : f.title}
            </h4>
            <div className="flex items-center gap-1.5 shrink-0">
              {f.similarity !== undefined && (
                <Badge variant="outline" className="text-[10px] uppercase tracking-wider">
                  {Math.round(f.similarity * 100)}%
                </Badge>
              )}
              <Badge variant="outline" className={`text-[10px] uppercase tracking-wider ${IMPORTANCE_COLORS[f.importance] || ''}`}>
                {f.importance}
              </Badge>
            </div>
          </div>
          <p className="font-serif text-[14px] text-ink-soft leading-relaxed">{f.summary}</p>
          <div className="type-kicker flex items-center gap-3 mt-2 text-ink-faint">
            <span>[{f.run_date}]</span>
            <Badge variant="outline" className="text-[10px] uppercase tracking-wider text-ok bg-ok/10 border-ok/20">
              {f.agent.replace('-researcher', '')}
            </Badge>
            {f.source_name && f.source_url ? (
              <a href={f.source_url} target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">
                {f.source_name}
              </a>
            ) : f.source_name ? (
              <span>{f.source_name}</span>
            ) : null}
          </div>
        </motion.div>
      ))}
    </div>
  )
}
