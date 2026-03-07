'use client'

import { motion } from 'motion/react'
import type { Source } from '@/lib/types'

export function SourceTable({ data }: { data: unknown }) {
  const sources = data as Source[]
  if (!sources?.length) return <p className="text-sm text-muted-foreground">No sources tracked yet.</p>

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border">
            <th className="text-left text-xs text-muted-foreground font-medium px-4 py-2 uppercase tracking-wider">Source</th>
            <th className="text-right text-xs text-muted-foreground font-medium px-4 py-2 uppercase tracking-wider">High-value</th>
            <th className="text-right text-xs text-muted-foreground font-medium px-4 py-2 uppercase tracking-wider">Total</th>
            <th className="text-right text-xs text-muted-foreground font-medium px-4 py-2 uppercase tracking-wider">Last seen</th>
          </tr>
        </thead>
        <tbody>
          {sources.map((s, i) => (
            <motion.tr
              key={s.url_domain}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: Math.min(i * 0.02, 0.5) }}
              className="border-b border-border/50 last:border-0 hover:bg-muted/20 transition-colors"
            >
              <td className="px-4 py-2.5 font-medium">
                <a
                  href={`https://${s.url_domain}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  {s.display_name || s.url_domain}
                </a>
              </td>
              <td className="px-4 py-2.5 text-right">
                <span className="text-green-400 font-medium">{s.high_value_count}</span>
              </td>
              <td className="px-4 py-2.5 text-right text-muted-foreground">{s.hit_count}</td>
              <td className="px-4 py-2.5 text-right text-muted-foreground text-xs">{s.last_seen}</td>
            </motion.tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
