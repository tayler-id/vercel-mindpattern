'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { Skill } from '@/lib/types'

const DIFFICULTY_COLORS: Record<string, string> = {
  beginner: 'text-green-400 bg-green-400/10 border-green-400/20',
  intermediate: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
  advanced: 'text-red-400 bg-red-400/10 border-red-400/20',
}

const DIFFICULTY_ICON: Record<string, string> = {
  beginner: '●',
  intermediate: '●●',
  advanced: '●●●',
}

function SkillCard({ skill, index }: { skill: Skill; index: number }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.03, 0.5) }}
      className="bg-card border border-border rounded-xl overflow-hidden hover:border-primary/30 transition-colors"
    >
      <div className="p-4">
        <div className="flex items-start justify-between gap-3 mb-2">
          <h4 className="text-sm font-medium leading-snug">
            {skill.source_url ? (
              <a href={skill.source_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                {skill.title}
              </a>
            ) : skill.title}
          </h4>
          <div className="flex gap-1.5 shrink-0">
            <Badge variant="outline" className={`text-[10px] ${DIFFICULTY_COLORS[skill.difficulty] || ''}`}>
              {DIFFICULTY_ICON[skill.difficulty] || ''} {skill.difficulty}
            </Badge>
            <Badge variant="outline" className="text-[10px] bg-primary/5 border-primary/20 text-primary">
              {skill.domain}
            </Badge>
          </div>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">{skill.description}</p>
        <div className="flex items-center gap-3 mt-3 text-[11px] text-muted-foreground">
          <span>{skill.run_date}</span>
          {skill.source_name && skill.source_url ? (
            <a href={skill.source_url} target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">
              {skill.source_name}
            </a>
          ) : skill.source_name ? (
            <span>{skill.source_name}</span>
          ) : null}
          {skill.similarity !== undefined && (
            <Badge variant="outline" className="text-[10px] bg-primary/5 border-primary/20 text-primary">
              {Math.round(skill.similarity * 100)}% match
            </Badge>
          )}
        </div>
      </div>

      {skill.steps && (
        <>
          <div className="border-t border-border">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setExpanded(!expanded)}
              className="w-full text-xs h-8 rounded-none text-muted-foreground hover:text-foreground"
            >
              {expanded ? 'Hide steps' : 'Show steps'}
              <svg
                width="12"
                height="12"
                viewBox="0 0 12 12"
                fill="none"
                className={`ml-1 transition-transform ${expanded ? 'rotate-180' : ''}`}
              >
                <path d="M3 5l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </Button>
          </div>
          <AnimatePresence>
            {expanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="px-4 py-3 bg-muted/20 border-t border-border">
                  <pre className="text-xs text-muted-foreground whitespace-pre-wrap leading-relaxed font-mono">
                    {skill.steps}
                  </pre>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
    </motion.div>
  )
}

export function SkillCards({ data, limit }: { data: unknown; limit?: number }) {
  const skills = data as Skill[]
  if (!skills?.length) return <p className="text-sm text-muted-foreground">No skills found.</p>

  const displayed = limit ? skills.slice(0, limit) : skills

  return (
    <div className="space-y-2">
      {displayed.map((s, i) => (
        <SkillCard key={`${s.id}-${i}`} skill={s} index={i} />
      ))}
    </div>
  )
}
