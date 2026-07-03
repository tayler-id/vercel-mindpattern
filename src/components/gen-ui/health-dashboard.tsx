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
      className="rounded-[3px] border border-line bg-paper px-4 py-3 flex-1 min-w-[100px]"
    >
      <p className="type-kicker text-ink-faint">{label}</p>
      <p className={`type-display text-[30px] leading-[1.05] mt-1 ${color}`}>{value}</p>
      {sub && <p className="type-kicker text-ink-faint mt-1">{sub}</p>}
    </motion.div>
  )
}

/* Flat white chart tooltip — 1px ink border, 3px radius (design-system chart rule). */
function ChartTip({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-[3px] border border-ink bg-paper px-3 py-2 font-mono text-[11px] leading-[1.5]">
      {children}
    </div>
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
          color="text-(--chart-2)"
        />
        <MetricCard label="Avg Score" value={`${avgScore}%`} color="text-ink" />
        <MetricCard label="Pending" value={health.approval_summary?.pending ?? 0} color="text-(--chart-3)" />
        <MetricCard label="Decided" value={health.approval_summary?.decided ?? 0} color="text-ink" />
      </div>

      {qualityData.length > 1 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="border-t border-line pt-4"
        >
          <p className="type-display text-[19px] leading-[1.1] text-ink mb-3">
            Pipeline quality trend
          </p>
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={qualityData}>
              <XAxis
                dataKey="date"
                tick={{ fill: 'var(--ink-faint)', fontSize: 10, fontFamily: 'var(--font-mono)' }}
                axisLine={false}
                tickLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                domain={[0, 100]}
                tick={{ fill: 'var(--ink-faint)', fontSize: 10, fontFamily: 'var(--font-mono)' }}
                axisLine={false}
                tickLine={false}
                width={30}
                tickFormatter={(v) => `${v}%`}
              />
              <ReferenceLine y={70} stroke="var(--chart-2)" strokeDasharray="3 3" strokeOpacity={0.4} />
              <ReferenceLine y={40} stroke="var(--chart-3)" strokeDasharray="3 3" strokeOpacity={0.4} />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (!active || !payload?.length) return null
                  const d = payload[0].payload
                  return (
                    <ChartTip>
                      <p className="text-ink-soft">{label}</p>
                      <p className="text-ink font-semibold">{d.score}% quality</p>
                      <p className="text-ink-soft">{d.findings} findings / {d.sources} sources</p>
                    </ChartTip>
                  )
                }}
              />
              <Line
                type="monotone"
                dataKey="score"
                stroke="var(--chart-2)"
                strokeWidth={2}
                dot={{ r: 3, fill: 'var(--chart-2)', stroke: 'var(--background)', strokeWidth: 2 }}
                activeDot={{ r: 5, fill: 'var(--chart-2)', stroke: 'var(--background)', strokeWidth: 2 }}
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
          className="border-t border-line pt-4"
        >
          <p className="type-display text-[19px] leading-[1.1] text-ink mb-3">
            Daily findings volume
          </p>
          <ResponsiveContainer width="100%" height={120}>
            <AreaChart data={findingsData}>
              <XAxis
                dataKey="date"
                tick={{ fill: 'var(--ink-faint)', fontSize: 10, fontFamily: 'var(--font-mono)' }}
                axisLine={false}
                tickLine={false}
                interval="preserveStartEnd"
              />
              <YAxis hide />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (!active || !payload?.length) return null
                  return (
                    <ChartTip>
                      <p className="text-ink-soft">{label}</p>
                      <p className="text-(--spectrum-4-text) font-semibold">{payload[0]?.value} total</p>
                      <p className="text-(--chart-3)">{payload[1]?.value} high-value</p>
                    </ChartTip>
                  )
                }}
              />
              <Area type="monotone" dataKey="findings" stroke="var(--chart-4)" strokeWidth={2} fill="var(--chart-4)" fillOpacity={0.15} dot={false} />
              <Area type="monotone" dataKey="highValue" stroke="var(--chart-3)" strokeWidth={2} fill="var(--chart-3)" fillOpacity={0.15} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
          <div className="type-kicker flex gap-4 mt-2 text-ink-faint">
            <span className="flex items-center gap-1.5"><span className="inline-block size-2 rounded-full bg-chart-4" /> Total</span>
            <span className="flex items-center gap-1.5"><span className="inline-block size-2 rounded-full bg-chart-3" /> High-value</span>
          </div>
        </motion.div>
      )}

      {agentData.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="border-t border-line pt-4"
        >
          <p className="type-display text-[19px] leading-[1.1] text-ink mb-3">
            Agent activity
          </p>
          <ResponsiveContainer width="100%" height={agentData.length * 26 + 8}>
            <BarChart data={agentData} layout="vertical" margin={{ left: 70, right: 20 }}>
              <XAxis type="number" hide />
              <YAxis
                dataKey="agent"
                type="category"
                tick={{ fill: 'var(--ink-faint)', fontSize: 11, fontFamily: 'var(--font-mono)' }}
                axisLine={false}
                tickLine={false}
                width={65}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null
                  const d = payload[0]?.payload
                  return (
                    <ChartTip>
                      <p className="text-ink font-semibold">{d.success} success</p>
                      {d.warning > 0 && <p className="text-(--chart-3)">{d.warning} warnings</p>}
                      {d.error > 0 && <p className="text-(--chart-1)">{d.error} errors</p>}
                    </ChartTip>
                  )
                }}
              />
              <Bar dataKey="success" stackId="a" fill="var(--chart-2)" barSize={14} />
              <Bar dataKey="warning" stackId="a" fill="var(--chart-3)" barSize={14} />
              <Bar dataKey="error" stackId="a" fill="var(--chart-1)" barSize={14} />
            </BarChart>
          </ResponsiveContainer>
          <div className="type-kicker flex gap-4 mt-2 text-ink-faint">
            <span className="flex items-center gap-1.5"><span className="inline-block size-2 rounded-full bg-chart-2" /> Success</span>
            <span className="flex items-center gap-1.5"><span className="inline-block size-2 rounded-full bg-chart-3" /> Warning</span>
            <span className="flex items-center gap-1.5"><span className="inline-block size-2 rounded-full bg-chart-1" /> Error</span>
          </div>
        </motion.div>
      )}

      {health.recent_errors?.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="border-t border-line pt-4"
        >
          <p className="type-display text-[19px] leading-[1.1] text-ink mb-3">
            Recent errors &amp; warnings
          </p>
          <div className="flex flex-col">
            {health.recent_errors.slice(0, 5).map((e, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + i * 0.05 }}
                className="rule-row text-xs py-2"
              >
                <div className="type-kicker flex items-center gap-2 text-ink-faint mb-0.5">
                  <span className="font-semibold" style={{ color: e.note_type === 'error' ? 'var(--chart-1)' : e.note_type === 'warning' ? 'var(--chart-3)' : 'var(--spectrum-4-text)' }}>
                    [{e.note_type}]
                  </span>
                  <span>{e.agent?.replace('-researcher', '')}</span>
                  <span>{e.run_date}</span>
                </div>
                <p className="text-ink-soft text-[11px]">{e.content?.substring(0, 150)}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  )
}
