'use client'

import { motion } from 'motion/react'
import {
  BarChart,
  Bar,
  XAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import type { Source } from '@/lib/types'

export function SourceTable({ data }: { data: unknown }) {
  const sources = data as Source[]
  if (!sources?.length) {
    return (
      <p className="text-xs text-muted-foreground uppercase tracking-wider font-bold">
        [NO SOURCES ON FILE]
      </p>
    )
  }

  const topSources = sources.slice(0, 8)
  const chartData = topSources.map((s) => ({
    name: s.display_name || s.url_domain,
    highValue: s.high_value_count,
    total: s.hit_count,
  }))

  return (
    <div className="flex flex-col gap-4">
      {chartData.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card border border-border dossier-card p-4 grid-paper"
        >
          <p className="text-[10px] text-muted-foreground mb-3 uppercase tracking-wider font-bold">
            Top sources by high-value findings
          </p>
          <ResponsiveContainer width="100%" height={120}>
            <BarChart data={chartData}>
              <XAxis
                dataKey="name"
                tick={{ fill: 'var(--muted-foreground)', fontSize: 9 }}
                axisLine={false}
                tickLine={false}
                interval={0}
                angle={-20}
                textAnchor="end"
                height={40}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null
                  const d = payload[0]?.payload
                  return (
                    <div className="bg-popover border border-border px-3 py-2 text-xs shadow-lg">
                      <p className="text-foreground font-bold">{d.name}</p>
                      <p className="text-olive">{d.highValue} high-value</p>
                      <p className="text-muted-foreground">{d.total} total hits</p>
                    </div>
                  )
                }}
              />
              <Bar dataKey="highValue" radius={[2, 2, 0, 0]} barSize={24} fill="var(--olive)" fillOpacity={0.7} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-card border border-border dossier-card overflow-hidden"
      >
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left text-[10px] text-muted-foreground font-bold uppercase tracking-wider px-4 py-2">Source</th>
              <th className="text-right text-[10px] text-muted-foreground font-bold uppercase tracking-wider px-4 py-2">High-value</th>
              <th className="text-right text-[10px] text-muted-foreground font-bold uppercase tracking-wider px-4 py-2">Total</th>
              <th className="text-right text-[10px] text-muted-foreground font-bold uppercase tracking-wider px-4 py-2 hidden sm:table-cell">Quality</th>
              <th className="text-right text-[10px] text-muted-foreground font-bold uppercase tracking-wider px-4 py-2">Last seen</th>
            </tr>
          </thead>
          <tbody>
            {sources.map((s, i) => {
              const qualityRatio = s.hit_count > 0 ? Math.round((s.high_value_count / s.hit_count) * 100) : 0
              return (
                <motion.tr
                  key={s.url_domain}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: Math.min(i * 0.02, 0.5) }}
                  className="border-b border-border/50 last:border-0 hover:bg-muted/20 transition-colors"
                >
                  <td className="px-4 py-2.5 font-bold">
                    <a href={`https://${s.url_domain}`} target="_blank" rel="noopener noreferrer" className="text-navy hover:underline">
                      {s.display_name || s.url_domain}
                    </a>
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <span className="text-olive font-bold">{s.high_value_count}</span>
                  </td>
                  <td className="px-4 py-2.5 text-right text-muted-foreground">{s.hit_count}</td>
                  <td className="px-4 py-2.5 text-right hidden sm:table-cell">
                    <div className="flex items-center justify-end gap-1.5">
                      <div className="w-12 h-1 bg-muted overflow-hidden">
                        <div
                          className="h-full"
                          style={{
                            width: `${qualityRatio}%`,
                            backgroundColor: qualityRatio > 50 ? 'var(--olive)' : qualityRatio > 25 ? 'var(--chart-4)' : 'var(--primary)',
                          }}
                        />
                      </div>
                      <span className="text-[10px] text-muted-foreground w-7 text-right">{qualityRatio}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-2.5 text-right text-muted-foreground text-[11px]">{s.last_seen}</td>
                </motion.tr>
              )
            })}
          </tbody>
        </table>
      </motion.div>
    </div>
  )
}
