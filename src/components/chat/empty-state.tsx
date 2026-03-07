'use client'

import { motion } from 'motion/react'

const DIRECTIVES = [
  { code: 'DIR-01', text: 'Show me the stats' },
  { code: 'DIR-02', text: 'How is the system health?' },
  { code: 'DIR-03', text: 'What are the top sources?' },
  { code: 'DIR-04', text: 'What patterns are trending?' },
  { code: 'DIR-05', text: "Show me today's findings" },
  { code: 'DIR-06', text: 'What skills about prompt engineering?' },
  { code: 'DIR-07', text: 'Show me the latest report' },
  { code: 'DIR-08', text: 'Search findings about AI agents' },
]

export function EmptyState({ onSuggestion }: { onSuggestion: (text: string) => void }) {
  return (
    <div className="flex flex-col items-center justify-center h-full px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center max-w-lg"
      >
        <div className="relative mx-auto mb-6 inline-block">
          <div className="border-2 border-primary px-6 py-3 stamp">
            <span className="text-primary text-lg font-bold tracking-[0.2em]">
              OPEN NEW CASE
            </span>
          </div>
        </div>
        <p className="text-muted-foreground mb-8 text-xs leading-relaxed max-w-md mx-auto uppercase tracking-wider">
          Intelligence briefing system online. 13 research agents reporting.
          Query the database or issue a directive below.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-xl w-full"
      >
        {DIRECTIVES.map(({ code, text }, i) => (
          <motion.button
            key={text}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 + i * 0.05 }}
            onClick={() => onSuggestion(text)}
            className="group text-left text-xs px-4 py-3 border border-border bg-card dossier-card hover:border-primary/50 transition-all text-foreground flex items-start gap-3"
          >
            <span className="text-[10px] text-primary font-bold uppercase tracking-wider shrink-0 mt-px">
              {code}
            </span>
            <span className="leading-snug text-muted-foreground group-hover:text-foreground transition-colors">
              {text}
            </span>
          </motion.button>
        ))}
      </motion.div>
    </div>
  )
}
