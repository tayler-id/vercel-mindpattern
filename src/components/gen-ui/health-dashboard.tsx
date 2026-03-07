'use client'

import { motion } from 'motion/react'
import type { HealthData } from '@/lib/types'

export function HealthDashboard({ data }: { data: unknown }) {
  const health = data as HealthData

  const agentCounts: Record<string, number> = {}
  health.agent_stats.forEach(s => {
    agentCounts[s.agent] = (agentCounts[s.agent] || 0) + s.count
  })
  const maxAgentCount = Math.max(...Object.values(agentCounts), 1)

  const runs = [...health.pipeline_runs].reverse()
  const maxScore = Math.max(...runs.map(r => r.overall_score || 0), 0.01)

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <div className="bg-card border border-border rounded-xl px-4 py-3 flex-1">
          <p className="text-[11px] text-muted-foreground">Pending</p>
          <p className="text-lg font-semibold">{health.approval_summary.pending}</p>
        </div>
        <div className="bg-card border border-border rounded-xl px-4 py-3 flex-1">
          <p className="text-[11px] text-muted-foreground">Decided</p>
          <p className="text-lg font-semibold">{health.approval_summary.decided}</p>
        </div>
      </div>

      {runs.length > 0 && (
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-xs text-muted-foreground mb-3">Pipeline quality (last {runs.length} runs)</p>
          <div className="flex items-end gap-1 h-16">
            {runs.map((r, i) => {
              const score = r.overall_score || 0
              const color = score > 0.7 ? 'bg-green-400/60' : score > 0.4 ? 'bg-yellow-400/60' : 'bg-red-400/60'
              return (
                <motion.div
                  key={r.run_date}
                  initial={{ height: 0 }}
                  animate={{ height: `${Math.max((score / maxScore) * 100, 3)}%` }}
                  transition={{ delay: i * 0.02 }}
                  className={`flex-1 ${color} rounded-t-sm min-h-[2px]`}
                  title={`${r.run_date}: ${(score * 100).toFixed(0)}% (${r.total_findings} findings)`}
                />
              )
            })}
          </div>
        </div>
      )}

      {Object.keys(agentCounts).length > 0 && (
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-xs text-muted-foreground mb-3">Agent activity</p>
          <div className="space-y-1.5">
            {Object.entries(agentCounts)
              .sort((a, b) => b[1] - a[1])
              .map(([agent, count]) => (
                <div key={agent} className="flex items-center gap-2 text-xs">
                  <span className="text-muted-foreground w-28 truncate">{agent.replace('-researcher', '')}</span>
                  <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-primary/50 rounded-full" style={{ width: `${(count / maxAgentCount) * 100}%` }} />
                  </div>
                  <span className="text-muted-foreground w-8 text-right">{count}</span>
                </div>
              ))}
          </div>
        </div>
      )}

      {health.recent_errors.length > 0 && (
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-xs text-muted-foreground mb-3">Recent errors & warnings</p>
          <div className="space-y-2">
            {health.recent_errors.slice(0, 5).map((e, i) => (
              <div key={i} className="text-xs">
                <div className="flex items-center gap-2 text-muted-foreground mb-0.5">
                  <span className={e.note_type === 'error' ? 'text-red-400 font-medium' : 'text-yellow-400 font-medium'}>
                    {e.note_type}
                  </span>
                  <span>{e.agent}</span>
                  <span>{e.run_date}</span>
                </div>
                <p className="text-muted-foreground">{e.content?.substring(0, 150)}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
