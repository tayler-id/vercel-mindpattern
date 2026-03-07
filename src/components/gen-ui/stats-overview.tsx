'use client'

import { motion } from 'motion/react'
import type { Stats } from '@/lib/types'

export function StatsOverview({ data }: { data: unknown }) {
  const stats = data as Stats

  const pills = [
    { label: 'Findings', value: stats.findings, color: 'bg-primary/10 text-primary' },
    { label: 'Skills', value: stats.skills, color: 'bg-green-400/10 text-green-400' },
    { label: 'Sources', value: stats.sources, color: 'bg-yellow-400/10 text-yellow-400' },
    { label: 'Patterns', value: stats.patterns, color: 'bg-purple-400/10 text-purple-400' },
  ]

  const dates = Object.entries(stats.by_date).slice(0, 14)
  const maxCount = Math.max(...dates.map(([, c]) => c), 1)

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {pills.map((pill, i) => (
          <motion.div
            key={pill.label}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.05 }}
            className={`${pill.color} rounded-full px-3 py-1 text-sm font-medium`}
          >
            {pill.value.toLocaleString()} {pill.label.toLowerCase()}
          </motion.div>
        ))}
      </div>

      {dates.length > 0 && (
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-xs text-muted-foreground mb-3">Findings per day (last {dates.length} days)</p>
          <div className="flex items-end gap-1 h-20">
            {[...dates].reverse().map(([date, count], i) => (
              <motion.div
                key={date}
                initial={{ height: 0 }}
                animate={{ height: `${(count / maxCount) * 100}%` }}
                transition={{ delay: i * 0.03, type: 'spring', stiffness: 200 }}
                className="flex-1 bg-primary/40 rounded-t-sm min-h-[2px] hover:bg-primary/60 transition-colors cursor-default"
                title={`${date}: ${count} findings`}
              />
            ))}
          </div>
          <div className="flex justify-between mt-1 text-[10px] text-muted-foreground">
            <span>{dates[dates.length - 1]?.[0]?.slice(5)}</span>
            <span>{dates[0]?.[0]?.slice(5)}</span>
          </div>
        </div>
      )}

      {Object.keys(stats.by_agent).length > 0 && (
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-xs text-muted-foreground mb-3">Findings by agent</p>
          <div className="space-y-1.5">
            {Object.entries(stats.by_agent).slice(0, 8).map(([agent, count]) => (
              <div key={agent} className="flex items-center gap-2 text-xs">
                <span className="text-muted-foreground w-32 truncate">{agent.replace('-researcher', '')}</span>
                <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary/50 rounded-full"
                    style={{ width: `${(count / Math.max(...Object.values(stats.by_agent))) * 100}%` }}
                  />
                </div>
                <span className="text-muted-foreground w-8 text-right">{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
