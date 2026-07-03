'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Button } from '@/components/ui/button'
import { ChevronDown } from 'lucide-react'
import type { Skill } from '@/lib/types'

const DIFFICULTY_ICON: Record<string, string> = {
  beginner: 'I',
  intermediate: 'II',
  advanced: 'III',
}

/* Solid pill treatments per difficulty — spectrum only, no green; yellow carries ink text. */
const DIFFICULTY_VARS: Record<string, React.CSSProperties> = {
  beginner: { '--tc': 'var(--spectrum-2)', '--tc-on': '#ffffff' } as React.CSSProperties,
  intermediate: { '--tc': 'var(--spectrum-4)', '--tc-on': 'var(--ink)' } as React.CSSProperties,
  advanced: { '--tc': 'var(--spectrum-1)', '--tc-on': '#ffffff' } as React.CSSProperties,
}

function SkillCard({ skill, index }: { skill: Skill; index: number }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.03, 0.5) }}
      className="rounded-[3px] border-[1.5px] border-ink bg-paper overflow-hidden transition-colors"
    >
      <div className="p-4">
        <div className="flex items-start justify-between gap-5 mb-2">
          <h4 className="type-display text-[19px] leading-[1.1] text-ink">
            {skill.source_url ? (
              <a href={skill.source_url} target="_blank" rel="noopener noreferrer" className="hover:underline">
                {skill.title}
              </a>
            ) : skill.title}
          </h4>
          <div className="flex gap-1.5 shrink-0">
            <span className="tag-chip" style={DIFFICULTY_VARS[skill.difficulty]}>
              {DIFFICULTY_ICON[skill.difficulty] || ''} {skill.difficulty}
            </span>
            <span className="inline-flex items-center rounded-full bg-ink px-3 py-1 font-mono text-[10.5px] leading-none font-semibold uppercase tracking-[0.12em] text-white">
              {skill.domain}
            </span>
          </div>
        </div>
        <p className="text-[14px] text-ink-soft leading-[1.55]">{skill.description}</p>
        <div className="type-kicker flex flex-wrap items-center gap-3 mt-3 text-ink-faint">
          <span>[{skill.run_date}]</span>
          {skill.source_name && skill.source_url ? (
            <a href={skill.source_url} target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">
              {skill.source_name}
            </a>
          ) : skill.source_name ? (
            <span>{skill.source_name}</span>
          ) : null}
          {skill.similarity !== undefined && (
            <span className="inline-flex items-center rounded-full bg-panel px-3 py-1 font-mono text-[10.5px] leading-none font-semibold uppercase tracking-[0.12em] text-ink">
              {Math.round(skill.similarity * 100)}% match
            </span>
          )}
        </div>
      </div>

      {skill.steps && (
        <>
          <div className="border-t border-line">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setExpanded(!expanded)}
              className="w-full h-8 rounded-none text-[10.5px] text-ink-soft hover:text-ink tracking-[0.12em] active:scale-100"
            >
              {expanded ? 'Hide steps' : 'Show steps'}
              <ChevronDown data-icon="inline-end" className={`transition-transform ${expanded ? 'rotate-180' : ''}`} />
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
                <div className="px-4 py-3 bg-panel border-t border-line">
                  <pre className="text-[11px] text-ink-soft whitespace-pre-wrap leading-relaxed">
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
  if (!skills?.length) {
    return (
      <p className="type-kicker text-ink-soft">
        [NO SKILLS ON FILE]
      </p>
    )
  }

  const displayed = limit ? skills.slice(0, limit) : skills

  return (
    <div className="flex flex-col gap-2">
      {displayed.map((s, i) => (
        <SkillCard key={`${s.id}-${i}`} skill={s} index={i} />
      ))}
    </div>
  )
}
