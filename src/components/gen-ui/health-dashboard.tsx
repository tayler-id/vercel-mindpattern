'use client'

import { motion } from 'motion/react'
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts'
import type { HealthData } from '@/lib/types'

const STATUS_COLORS: Record<string, string> = {
  success: '#34d399',
  error: '#f87171',
  warning: '#fbbf24',
  info: '#60a5fa',
}

function MetricCard({ label, value, sub, color }: { label: string; value: string | number; sub?: string; color: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card border border-border rounded-xl px-4 py-3 flex-1 min-w-[100px]"
    >
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p className={`text-xl font-bold ${color}`}>{value}</p>
      {sub && <p className="text-[10px] text-muted-foreground mt-0.5">{sub}</p>}
    </motion.div>
  )
}

export function HealthDashboard({ data }: { data: unknown }) {
  const health = data as HealthData
  if (!health) return null

  const runs = [...(health.pipeline_runs || [])].sort((a, b) => a.run_date.localeCompare(b.run_date))
  const qualityData = runs.map((r) => ({
    date: r.run_date.slice(5),
    score: Math.round((r.overall_score || 0) * 100),
    findings: r.total_findings,
    sources: r.unique_sources,
    highValue: r.high_value_count,
  }))

  const avgScore = qualityData.length
    ? Math.round(qualityData.reduce((s, d) => s + d.score, 0) / qualityData.length)
    : 0
  const latestScore = qualityData.length ? qualityData[qualityData.length - 1].score : 0
  const trend = qualityData.length >= 2
    ? qualityData[qualityData.length - 1].score - qualityData[qualityData.length - 2].score
    : 0

  const agentCounts: Record<string, { success: number; error: number; warning: number }> = {}
  ;(health.agent_stats || []).forEach((s) => {
    if (!agentCounts[s.agent]) agentCounts[s.agent] = { success: 0, error: 0, warning: 0 }
    if (s.note_type === 'error') agentCounts[s.agent].error += s.count
    else if (s.note_type === 'warning') agentCounts[s.agent].warning += s.count
    else agentCounts[s.agent].success += s.count
  })
  const agentData = Object.entries(agentCounts)
    .map(([agent, counts]) => ({
      agent: agent.replace('-researcher', ''),
      ...counts,
      total: counts.success + counts.error + counts.warning,
    }))
    .sort((a, b) => b.total - a.total)

  const findingsData = runs.map((r) => ({
    date: r.run_date.slice(5),
    findings: r.total_findings,
    highValue: r.high_value_count,
  }))

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <MetricCard
          label="Quality Score"
          value={`${latestScore}%`}
          sub={trend > 0 ? `+${trend}% from prev` : trend < 0 ? `${trend}% from prev` : 'stable'}
          color={latestScore > 70 ? 'text-emerald-400' : latestScore > 40 ? 'text-amber-400' : 'text-red-400'}
        />
        <MetricCard label="Avg Score" value={`${avgScore}%`} color="text-blue-400" />
        <MetricCard label="Pending" value={health.approval_summary?.pending ?? 0} color="text-amber-400" />
        <MetricCard label="Decided" value={health.approval_summary?.decided ?? 0} color="text-emerald-400" />
      </div>

      {qualityData.length > 1 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card border border-border rounded-xl p-4"
        >
          <p className="text-xs text-muted-foreground mb-3">Pipeline quality trend</p>
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={qualityData}>
              <XAxis
                dataKey="date"
                tick={{ fill: '#9ca3af', fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                domain={[0, 100]}
                tick={{ fill: '#9ca3af', fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                width={30}
                tickFormatter={(v) => `${v}%`}
              />
              <ReferenceLine y={70} stroke="#34d399" strokeDasharray="3 3" strokeOpacity={0.4} />
              <ReferenceLine y={40} stroke="#fbbf24" strokeDasharray="3 3" strokeOpacity={0.4} />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (!active || !payload?.length) return null
                  const d = payload[0].payload
                  return (
                    <div className="bg-popover border border-border rounded-lg px-3 py-2 text-xs shadow-xl">
                      <p className="text-muted-foreground">{label}</p>
                      <p className="text-emerald-400 font-semibold">{d.score}% quality</p>
                      <p className="text-muted-foreground">{d.findings} findings / {d.sources} sources</p>
                    </div>
                  )
                }}
              />
              <Line
                type="monotone"
                dataKey="score"
                stroke="#34d399"
                strokeWidth={2}
                dot={{ r: 3, fill: '#34d399', stroke: '#1e293b', strokeWidth: 2 }}
                activeDot={{ r: 5, fill: '#34d399', stroke: '#1e293b', strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>
      )}

      {findingsData.length > 1 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-card border border-border rounded-xl p-4"
        >
          <p className="text-xs text-muted-foreground mb-3">Daily findings volume</p>
          <ResponsiveContainer width="100%" height={120}>
            <AreaChart data={findingsData}>
              <defs>
                <linearGradient id="totalGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#60a5fa" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#60a5fa" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="hvGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#fbbf24" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#fbbf24" stopOpacity={0} />
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
                      <p className="text-blue-400 font-semibold">{payload[0]?.value} total</p>
                      <p className="text-amber-400">{payload[1]?.value} high-value</p>
                    </div>
                  )
                }}
              />
              <Area type="monotone" dataKey="findings" stroke="#60a5fa" strokeWidth={1.5} fill="url(#totalGrad)" dot={false} />
              <Area type="monotone" dataKey="highValue" stroke="#fbbf24" strokeWidth={1.5} fill="url(#hvGrad)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
          <div className="flex gap-4 mt-2 text-[10px] text-muted-foreground">
            <span className="flex items-center gap-1"><span className="inline-block w-2 h-2 rounded-full bg-blue-400" /> Total</span>
            <span className="flex items-center gap-1"><span className="inline-block w-2 h-2 rounded-full bg-amber-400" /> High-value</span>
          </div>
        </motion.div>
      )}

      {agentData.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-card border border-border rounded-xl p-4"
        >
          <p className="text-xs text-muted-foreground mb-3">Agent activity</p>
          <ResponsiveContainer width="100%" height={agentData.length * 26 + 8}>
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
                  const d = payload[0]?.payload
                  return (
                    <div className="bg-popover border border-border rounded-lg px-3 py-2 text-xs shadow-xl">
                      <p className="text-emerald-400">{d.success} success</p>
                      {d.warning > 0 && <p className="text-amber-400">{d.warning} warnings</p>}
                      {d.error > 0 && <p className="text-red-400">{d.error} errors</p>}
                    </div>
                  )
                }}
              />
              <Bar dataKey="success" stackId="a" fill="#34d399" fillOpacity={0.6} barSize={14} />
              <Bar dataKey="warning" stackId="a" fill="#fbbf24" fillOpacity={0.6} barSize={14} />
              <Bar dataKey="error" stackId="a" fill="#f87171" fillOpacity={0.6} radius={[0, 4, 4, 0]} barSize={14} />
            </BarChart>
          </ResponsiveContainer>
          <div className="flex gap-4 mt-2 text-[10px] text-muted-foreground">
            <span className="flex items-center gap-1"><span className="inline-block w-2 h-2 rounded-full bg-emerald-400" /> Success</span>
            <span className="flex items-center gap-1"><span className="inline-block w-2 h-2 rounded-full bg-amber-400" /> Warning</span>
            <span className="flex items-center gap-1"><span className="inline-block w-2 h-2 rounded-full bg-red-400" /> Error</span>
          </div>
        </motion.div>
      )}

      {health.recent_errors?.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="bg-card border border-border rounded-xl p-4"
        >
          <p className="text-xs text-muted-foreground mb-3">Recent errors & warnings</p>
          <div className="space-y-2">
            {health.recent_errors.slice(0, 5).map((e, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + i * 0.05 }}
                className="text-xs border-l-2 pl-3 py-1"
                style={{ borderColor: STATUS_COLORS[e.note_type] || STATUS_COLORS.info }}
              >
                <div className="flex items-center gap-2 text-muted-foreground mb-0.5">
                  <span className="font-medium" style={{ color: STATUS_COLORS[e.note_type] || STATUS_COLORS.info }}>
                    {e.note_type}
                  </span>
                  <span>{e.agent?.replace('-researcher', '')}</span>
                  <span>{e.run_date}</span>
                </div>
                <p className="text-muted-foreground">{e.content?.substring(0, 150)}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  )
}
