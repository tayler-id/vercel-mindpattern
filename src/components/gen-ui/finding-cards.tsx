'use client'

import { motion } from 'motion/react'
import type { Finding } from '@/lib/types'

/* Solid pill treatments per importance — spectrum only, no green. */
const IMPORTANCE_VARS: Record<string, React.CSSProperties> = {
  high: { '--tc': 'var(--spectrum-1)', '--tc-on': '#ffffff' } as React.CSSProperties,
  medium: { '--tc': 'var(--spectrum-2)', '--tc-on': '#ffffff' } as React.CSSProperties,
  low: { '--tc': 'var(--panel)', '--tc-on': 'var(--ink)' } as React.CSSProperties,
}

function NeutralPill({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full bg-panel px-3 py-1 font-mono text-[10.5px] leading-none font-semibold uppercase tracking-[0.12em] text-ink">
      {children}
    </span>
  )
}

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
          className="rule-row px-4 py-5 transition-colors hover:bg-spine"
        >
          <div className="flex items-start justify-between gap-5 mb-2">
            <h4 className="type-display text-[19px] leading-[1.1] text-ink">
              {f.source_url ? (
                <a href={f.source_url} target="_blank" rel="noopener noreferrer" className="hover:underline">
                  {f.title}
                </a>
              ) : f.title}
            </h4>
            <div className="flex items-center gap-1.5 shrink-0">
              {f.similarity !== undefined && (
                <NeutralPill>{Math.round(f.similarity * 100)}%</NeutralPill>
              )}
              <span
                className="tag-chip"
                style={IMPORTANCE_VARS[f.importance] || IMPORTANCE_VARS.low}
              >
                {f.importance}
              </span>
            </div>
          </div>
          <p className="text-[14px] text-ink-soft leading-[1.55]">{f.summary}</p>
          <div className="type-kicker flex flex-wrap items-center gap-3 mt-3 text-ink-faint">
            <span>[{f.run_date}]</span>
            <span className="tag-chip" style={{ '--tc': 'var(--spectrum-2)', '--tc-on': '#ffffff' } as React.CSSProperties}>
              {f.agent.replace('-researcher', '')}
            </span>
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
