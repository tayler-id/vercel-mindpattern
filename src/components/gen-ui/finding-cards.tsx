'use client'

import { motion } from 'motion/react'
import { Badge } from '@/components/ui/badge'
import { IMPORTANCE_COLORS } from '@/lib/constants'
import type { Finding } from '@/lib/types'

export function FindingCards({ data, limit }: { data: unknown; limit?: number }) {
  const findings = data as Finding[]
  if (!findings?.length) return <p className="text-sm text-muted-foreground">No findings found.</p>

  const displayed = limit ? findings.slice(0, limit) : findings

  return (
    <div className="space-y-2">
      {displayed.map((f, i) => (
        <motion.div
          key={`${f.id}-${i}`}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: Math.min(i * 0.03, 0.5) }}
          className="bg-card border border-border rounded-xl p-4 hover:border-primary/30 transition-colors"
        >
          <div className="flex items-start justify-between gap-3 mb-2">
            <h4 className="text-sm font-medium leading-snug">
              {f.source_url ? (
                <a href={f.source_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                  {f.title}
                </a>
              ) : f.title}
            </h4>
            <div className="flex items-center gap-1.5 shrink-0">
              {f.similarity !== undefined && (
                <Badge variant="outline" className="text-[10px] bg-primary/5 border-primary/20 text-primary">
                  {Math.round(f.similarity * 100)}%
                </Badge>
              )}
              <Badge variant="outline" className={`text-[10px] ${IMPORTANCE_COLORS[f.importance]}`}>
                {f.importance}
              </Badge>
            </div>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">{f.summary}</p>
          <div className="flex items-center gap-3 mt-2 text-[11px] text-muted-foreground">
            <span>{f.run_date}</span>
            <Badge variant="outline" className="text-[10px] bg-primary/5 border-primary/20 text-primary">
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
