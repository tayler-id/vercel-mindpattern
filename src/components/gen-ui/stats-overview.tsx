'use client'

import { motion } from 'motion/react'
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import type { Stats } from '@/lib/types'

function AnimatedCounter({ value, label, color }: { value: number; label: string; color: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`bg-card border border-border dossier-card px-4 py-3 flex-1 min-w-[120px] border-l-2 ${color}`}
    >
      <motion.p
        className="text-xl font-bold tabular-nums text-foreground"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        {value.toLocaleString()}
      </motion.p>
      <p className="text-[10px] text-muted-foreground mt-0.5 uppercase tracking-wider font-bold">{label}</p>
    </motion.div>
  )
}

export function StatsOverview({ data }: { data: unknown }) {
  const stats = data as Stats
  if (!stats) return null

  const dateEntries = Object.entries(stats.by_date || {}).sort(([a], [b]) => a.localeCompare(b))
  const chartData = dateEntries.map(([date, count]) => ({
    date: date.slice(5),
    fullDate: date,
    count,
  }))

  const agentEntries = Object.entries(stats.by_agent || {})
    .sort((a, b) => b[1] - a[1])
    .slice(0, 13)
  const agentData = agentEntries.map(([agent, count]) => ({
    agent: agent.replace('-researcher', ''),
    count,
  }))

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-2">
        <AnimatedCounter value={stats.findings} label="Findings" color="border-l-navy" />
        <AnimatedCounter value={stats.skills} label="Skills" color="border-l-olive" />
        <AnimatedCounter value={stats.sources} label="Sources" color="border-l-chart-4" />
        <AnimatedCounter value={stats.patterns} label="Patterns" color="border-l-primary" />
      </div>

      {chartData.length > 1 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card border border-border dossier-card p-4 grid-paper"
        >
          <p className="text-[10px] text-muted-foreground mb-3 uppercase tracking-wider font-bold">
            Findings per day
          </p>
          <ResponsiveContainer width="100%" height={140}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="findingsGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--navy)" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="var(--navy)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="date"
                tick={{ fill: 'var(--muted-foreground)', fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                interval="preserveStartEnd"
              />
              <YAxis hide />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (!active || !payload?.length) return null
                  return (
                    <div className="bg-popover border border-border px-3 py-2 text-xs shadow-lg">
                      <p className="text-muted-foreground">{label}</p>
                      <p className="text-foreground font-bold">{payload[0].value} findings</p>
                    </div>
                  )
                }}
              />
              <Area
                type="monotone"
                dataKey="count"
                stroke="var(--navy)"
                strokeWidth={2}
                fill="url(#findingsGradient)"
                dot={false}
                activeDot={{ r: 4, fill: 'var(--navy)', stroke: 'var(--background)', strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>
      )}

      {agentData.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-card border border-border dossier-card p-4 grid-paper"
        >
          <p className="text-[10px] text-muted-foreground mb-3 uppercase tracking-wider font-bold">
            Findings by agent
          </p>
          <ResponsiveContainer width="100%" height={agentData.length * 28 + 8}>
            <BarChart data={agentData} layout="vertical" margin={{ left: 70, right: 20 }}>
              <XAxis type="number" hide />
              <YAxis
                dataKey="agent"
                type="category"
                tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                width={65}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null
                  return (
                    <div className="bg-popover border border-border px-3 py-2 text-xs shadow-lg">
                      <p className="text-foreground font-bold">{payload[0].value} findings</p>
                    </div>
                  )
                }}
              />
              <Bar dataKey="count" radius={[0, 2, 2, 0]} barSize={16} fill="var(--olive)" fillOpacity={0.7} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      )}
    </div>
  )
}
