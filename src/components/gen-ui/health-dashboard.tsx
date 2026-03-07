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

function MetricCard({ label, value, sub, color }: { label: string; value: string | number; sub?: string; color: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-card border border-border dossier-card px-4 py-3 flex-1 min-w-[100px] border-l-2 ${color}`}
    >
      <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">{label}</p>
      <p className="text-lg font-bold text-foreground">{value}</p>
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
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-2">
        <MetricCard
          label="Quality Score"
          value={`${latestScore}%`}
          sub={trend > 0 ? `+${trend}% from prev` : trend < 0 ? `${trend}% from prev` : 'stable'}
          color="border-l-olive"
        />
        <MetricCard label="Avg Score" value={`${avgScore}%`} color="border-l-navy" />
        <MetricCard label="Pending" value={health.approval_summary?.pending ?? 0} color="border-l-chart-4" />
        <MetricCard label="Decided" value={health.approval_summary?.decided ?? 0} color="border-l-olive" />
      </div>

      {qualityData.length > 1 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card border border-border dossier-card p-4 grid-paper"
        >
          <p className="text-[10px] text-muted-foreground mb-3 uppercase tracking-wider font-bold">
            Pipeline quality trend
          </p>
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={qualityData}>
              <XAxis
                dataKey="date"
                tick={{ fill: 'var(--muted-foreground)', fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                domain={[0, 100]}
                tick={{ fill: 'var(--muted-foreground)', fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                width={30}
                tickFormatter={(v) => `${v}%`}
              />
              <ReferenceLine y={70} stroke="var(--olive)" strokeDasharray="3 3" strokeOpacity={0.4} />
              <ReferenceLine y={40} stroke="var(--chart-4)" strokeDasharray="3 3" strokeOpacity={0.4} />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (!active || !payload?.length) return null
                  const d = payload[0].payload
                  return (
                    <div className="bg-popover border border-border px-3 py-2 text-xs shadow-lg">
                      <p className="text-muted-foreground">{label}</p>
                      <p className="text-olive font-bold">{d.score}% quality</p>
                      <p className="text-muted-foreground">{d.findings} findings / {d.sources} sources</p>
                    </div>
                  )
                }}
              />
              <Line
                type="monotone"
                dataKey="score"
                stroke="var(--olive)"
                strokeWidth={2}
                dot={{ r: 3, fill: 'var(--olive)', stroke: 'var(--background)', strokeWidth: 2 }}
                activeDot={{ r: 5, fill: 'var(--olive)', stroke: 'var(--background)', strokeWidth: 2 }}
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
          className="bg-card border border-border dossier-card p-4 grid-paper"
        >
          <p className="text-[10px] text-muted-foreground mb-3 uppercase tracking-wider font-bold">
            Daily findings volume
          </p>
          <ResponsiveContainer width="100%" height={120}>
            <AreaChart data={findingsData}>
              <defs>
                <linearGradient id="totalGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--navy)" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="var(--navy)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="hvGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--chart-4)" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="var(--chart-4)" stopOpacity={0} />
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
                      <p className="text-navy font-bold">{payload[0]?.value} total</p>
                      <p className="text-chart-4">{payload[1]?.value} high-value</p>
                    </div>
                  )
                }}
              />
              <Area type="monotone" dataKey="findings" stroke="var(--navy)" strokeWidth={1.5} fill="url(#totalGrad)" dot={false} />
              <Area type="monotone" dataKey="highValue" stroke="var(--chart-4)" strokeWidth={1.5} fill="url(#hvGrad)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
          <div className="flex gap-4 mt-2 text-[10px] text-muted-foreground uppercase tracking-wider">
            <span className="flex items-center gap-1"><span className="inline-block size-2 bg-navy" /> Total</span>
            <span className="flex items-center gap-1"><span className="inline-block size-2 bg-chart-4" /> High-value</span>
          </div>
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
            Agent activity
          </p>
          <ResponsiveContainer width="100%" height={agentData.length * 26 + 8}>
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
                  const d = payload[0]?.payload
                  return (
                    <div className="bg-popover border border-border px-3 py-2 text-xs shadow-lg">
                      <p className="text-olive">{d.success} success</p>
                      {d.warning > 0 && <p className="text-chart-4">{d.warning} warnings</p>}
                      {d.error > 0 && <p className="text-primary">{d.error} errors</p>}
                    </div>
                  )
                }}
              />
              <Bar dataKey="success" stackId="a" fill="var(--olive)" fillOpacity={0.6} barSize={14} />
              <Bar dataKey="warning" stackId="a" fill="var(--chart-4)" fillOpacity={0.6} barSize={14} />
              <Bar dataKey="error" stackId="a" fill="var(--primary)" fillOpacity={0.6} radius={[0, 2, 2, 0]} barSize={14} />
            </BarChart>
          </ResponsiveContainer>
          <div className="flex gap-4 mt-2 text-[10px] text-muted-foreground uppercase tracking-wider">
            <span className="flex items-center gap-1"><span className="inline-block size-2 bg-olive" /> Success</span>
            <span className="flex items-center gap-1"><span className="inline-block size-2 bg-chart-4" /> Warning</span>
            <span className="flex items-center gap-1"><span className="inline-block size-2 bg-primary" /> Error</span>
          </div>
        </motion.div>
      )}

      {health.recent_errors?.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="bg-card border border-border dossier-card p-4"
        >
          <p className="text-[10px] text-muted-foreground mb-3 uppercase tracking-wider font-bold">
            Recent errors &amp; warnings
          </p>
          <div className="flex flex-col gap-2">
            {health.recent_errors.slice(0, 5).map((e, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + i * 0.05 }}
                className="text-xs border-l-2 pl-3 py-1"
                style={{ borderColor: e.note_type === 'error' ? 'var(--primary)' : e.note_type === 'warning' ? 'var(--chart-4)' : 'var(--navy)' }}
              >
                <div className="flex items-center gap-2 text-muted-foreground mb-0.5 text-[10px] uppercase tracking-wider">
                  <span className="font-bold" style={{ color: e.note_type === 'error' ? 'var(--primary)' : e.note_type === 'warning' ? 'var(--chart-4)' : 'var(--navy)' }}>
                    [{e.note_type}]
                  </span>
                  <span>{e.agent?.replace('-researcher', '')}</span>
                  <span>{e.run_date}</span>
                </div>
                <p className="text-muted-foreground text-[11px]">{e.content?.substring(0, 150)}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  )
}
