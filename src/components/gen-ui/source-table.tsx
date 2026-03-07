'use client'

import { motion } from 'motion/react'
import {
  BarChart,
  Bar,
  XAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import type { Source } from '@/lib/types'

const BAR_COLORS = ['#60a5fa', '#34d399', '#fbbf24', '#a78bfa', '#f87171', '#2dd4bf', '#fb923c', '#e879f9']

export function SourceTable({ data }: { data: unknown }) {
  const sources = data as Source[]
  if (!sources?.length) return <p className="text-sm text-muted-foreground">No sources tracked yet.</p>

  const topSources = sources.slice(0, 8)
  const chartData = topSources.map((s) => ({
    name: s.display_name || s.url_domain,
    highValue: s.high_value_count,
    total: s.hit_count,
  }))

  return (
    <div className="space-y-4">
      {/* Top sources chart */}
      {chartData.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card border border-border rounded-xl p-4"
        >
          <p className="text-xs text-muted-foreground mb-3">Top sources by high-value findings</p>
          <ResponsiveContainer width="100%" height={120}>
            <BarChart data={chartData}>
              <XAxis
                dataKey="name"
                tick={{ fill: '#9ca3af', fontSize: 9 }}
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
                    <div className="bg-popover border border-border rounded-lg px-3 py-2 text-xs shadow-xl">
                      <p className="text-foreground font-semibold">{d.name}</p>
                      <p className="text-emerald-400">{d.highValue} high-value</p>
                      <p className="text-muted-foreground">{d.total} total hits</p>
                    </div>
                  )
                }}
              />
              <Bar dataKey="highValue" radius={[4, 4, 0, 0]} barSize={24}>
                {chartData.map((_, i) => (
                  <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} fillOpacity={0.7} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      )}

      {/* Table */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-card border border-border rounded-xl overflow-hidden"
      >
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left text-xs text-muted-foreground font-medium px-4 py-2 uppercase tracking-wider">Source</th>
              <th className="text-right text-xs text-muted-foreground font-medium px-4 py-2 uppercase tracking-wider">High-value</th>
              <th className="text-right text-xs text-muted-foreground font-medium px-4 py-2 uppercase tracking-wider">Total</th>
              <th className="text-right text-xs text-muted-foreground font-medium px-4 py-2 uppercase tracking-wider hidden sm:table-cell">Quality</th>
              <th className="text-right text-xs text-muted-foreground font-medium px-4 py-2 uppercase tracking-wider">Last seen</th>
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
                  <td className="px-4 py-2.5 font-medium">
                    <a href={`https://${s.url_domain}`} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                      {s.display_name || s.url_domain}
                    </a>
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <span className="text-emerald-400 font-medium">{s.high_value_count}</span>
                  </td>
                  <td className="px-4 py-2.5 text-right text-muted-foreground">{s.hit_count}</td>
                  <td className="px-4 py-2.5 text-right hidden sm:table-cell">
                    <div className="flex items-center justify-end gap-1.5">
                      <div className="w-12 h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${qualityRatio}%`,
                            backgroundColor: qualityRatio > 50 ? '#34d399' : qualityRatio > 25 ? '#fbbf24' : '#f87171',
                          }}
                        />
                      </div>
                      <span className="text-[10px] text-muted-foreground w-7 text-right">{qualityRatio}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-2.5 text-right text-muted-foreground text-xs">{s.last_seen}</td>
                </motion.tr>
              )
            })}
          </tbody>
        </table>
      </motion.div>
    </div>
  )
}
