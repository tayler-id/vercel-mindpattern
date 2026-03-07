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
  Cell,
} from 'recharts'
import type { Stats } from '@/lib/types'

const AGENT_COLORS = [
  '#60a5fa', '#34d399', '#fbbf24', '#a78bfa', '#f87171',
  '#2dd4bf', '#fb923c', '#e879f9', '#38bdf8', '#4ade80',
  '#facc15', '#c084fc', '#f472b6',
]

function AnimatedCounter({ value, label, color }: { value: number; label: string; color: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`${color} rounded-xl px-4 py-3 flex-1 min-w-[120px]`}
    >
      <motion.p
        className="text-2xl font-bold tabular-nums"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        {value.toLocaleString()}
      </motion.p>
      <p className="text-xs opacity-70 mt-0.5">{label}</p>
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
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <AnimatedCounter value={stats.findings} label="Findings" color="bg-blue-500/10 text-blue-400" />
        <AnimatedCounter value={stats.skills} label="Skills" color="bg-emerald-500/10 text-emerald-400" />
        <AnimatedCounter value={stats.sources} label="Sources" color="bg-amber-500/10 text-amber-400" />
        <AnimatedCounter value={stats.patterns} label="Patterns" color="bg-purple-500/10 text-purple-400" />
      </div>

      {chartData.length > 1 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card border border-border rounded-xl p-4"
        >
          <p className="text-xs text-muted-foreground mb-3">Findings per day</p>
          <ResponsiveContainer width="100%" height={140}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="findingsGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#60a5fa" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#60a5fa" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="date"
                tick={{ fill: '#9ca3af', fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                interval="preserveStartEnd"
              />
              <YAxis hide />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (!active || !payload?.length) return null
                  return (
                    <div className="bg-popover border border-border rounded-lg px-3 py-2 text-xs shadow-xl">
                      <p className="text-muted-foreground">{label}</p>
                      <p className="text-foreground font-semibold">{payload[0].value} findings</p>
                    </div>
                  )
                }}
              />
              <Area
                type="monotone"
                dataKey="count"
                stroke="#60a5fa"
                strokeWidth={2}
                fill="url(#findingsGradient)"
                dot={false}
                activeDot={{ r: 4, fill: '#60a5fa', stroke: '#1e293b', strokeWidth: 2 }}
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
          className="bg-card border border-border rounded-xl p-4"
        >
          <p className="text-xs text-muted-foreground mb-3">Findings by agent</p>
          <ResponsiveContainer width="100%" height={agentData.length * 28 + 8}>
            <BarChart data={agentData} layout="vertical" margin={{ left: 70, right: 20 }}>
              <XAxis type="number" hide />
              <YAxis
                dataKey="agent"
                type="category"
                tick={{ fill: '#9ca3af', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                width={65}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null
                  return (
                    <div className="bg-popover border border-border rounded-lg px-3 py-2 text-xs shadow-xl">
                      <p className="text-foreground font-semibold">{payload[0].value} findings</p>
                    </div>
                  )
                }}
              />
              <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={16}>
                {agentData.map((_, i) => (
                  <Cell key={i} fill={AGENT_COLORS[i % AGENT_COLORS.length]} fillOpacity={0.7} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      )}
    </div>
  )
}
