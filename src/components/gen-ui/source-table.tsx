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
      <p className="type-kicker text-ink-soft">
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
          className="border-t border-line pt-4"
        >
          <p className="type-display text-[19px] leading-[1.1] text-ink mb-3">
            Top sources by high-value findings
          </p>
          <ResponsiveContainer width="100%" height={120}>
            <BarChart data={chartData}>
              <XAxis
                dataKey="name"
                tick={{ fill: 'var(--ink-faint)', fontSize: 10, fontFamily: 'var(--font-mono)' }}
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
                    <div className="rounded-[3px] border border-ink bg-paper px-3 py-2 font-mono text-[11px] leading-[1.5]">
                      <p className="text-ink font-semibold">{d.name}</p>
                      <p className="text-(--chart-2)">{d.highValue} high-value</p>
                      <p className="text-ink-soft">{d.total} total hits</p>
                    </div>
                  )
                }}
              />
              <Bar dataKey="highValue" barSize={24} fill="var(--chart-2)" />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="overflow-x-auto"
      >
        <table className="w-full text-xs">
          <thead>
            <tr>
              <th className="text-left font-mono font-semibold text-[10px] text-ink uppercase tracking-[0.14em] px-4 py-2 border-b-2 border-ink">Source</th>
              <th className="text-right font-mono font-semibold text-[10px] text-ink uppercase tracking-[0.14em] px-4 py-2 border-b-2 border-ink">High-value</th>
              <th className="text-right font-mono font-semibold text-[10px] text-ink uppercase tracking-[0.14em] px-4 py-2 border-b-2 border-ink">Total</th>
              <th className="text-right font-mono font-semibold text-[10px] text-ink uppercase tracking-[0.14em] px-4 py-2 border-b-2 border-ink hidden sm:table-cell">Quality</th>
              <th className="text-right font-mono font-semibold text-[10px] text-ink uppercase tracking-[0.14em] px-4 py-2 border-b-2 border-ink">Last seen</th>
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
                  className="border-b border-line last:border-0 hover:bg-spine transition-colors"
                >
                  <td className="px-4 py-2.5 font-semibold">
                    <a href={`https://${s.url_domain}`} target="_blank" rel="noopener noreferrer" className="text-ink hover:text-primary hover:underline">
                      {s.display_name || s.url_domain}
                    </a>
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <span className="font-mono text-ink font-semibold">{s.high_value_count}</span>
                  </td>
                  <td className="px-4 py-2.5 text-right font-mono text-ink-soft">{s.hit_count}</td>
                  <td className="px-4 py-2.5 text-right hidden sm:table-cell">
                    <div className="flex items-center justify-end gap-1.5">
                      <div className="w-12 h-1 rounded-full bg-panel overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${qualityRatio}%`,
                            backgroundColor: qualityRatio > 50 ? 'var(--chart-2)' : qualityRatio > 25 ? 'var(--chart-3)' : 'var(--chart-1)',
                          }}
                        />
                      </div>
                      <span className="font-mono text-[11px] text-ink-faint w-8 text-right">{qualityRatio}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-2.5 text-right font-mono text-ink-soft text-[11px]">{s.last_seen}</td>
                </motion.tr>
              )
            })}
          </tbody>
        </table>
      </motion.div>
    </div>
  )
}
