'use client'

import { motion } from 'motion/react'

const SUGGESTIONS = [
  { text: "What did my agents find today?", icon: "📡" },
  { text: "Show me the most important findings this week", icon: "🔥" },
  { text: "How are my research agents performing?", icon: "📊" },
  { text: "What patterns are emerging in AI?", icon: "🧩" },
  { text: "Teach me about context engineering", icon: "🎓" },
  { text: "Which sources produce the best research?", icon: "🏆" },
]

export function EmptyState({ onSuggestion }: { onSuggestion: (text: string) => void }) {
  return (
    <div className="flex flex-col items-center justify-center h-full px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center max-w-lg"
      >
        <div className="relative w-16 h-16 mx-auto mb-6">
          <div className="absolute inset-0 rounded-2xl bg-primary/20 blur-xl" />
          <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/25 flex items-center justify-center">
            <span className="text-primary text-2xl font-bold tracking-tight">M</span>
          </div>
        </div>
        <h1 className="text-2xl font-semibold mb-2 tracking-tight">MindPattern</h1>
        <p className="text-muted-foreground mb-8 text-sm leading-relaxed">
          Your AI research intelligence. Ask about findings, patterns, agent performance, or any topic your 13 research agents have covered.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-lg w-full"
      >
        {SUGGESTIONS.map(({ text, icon }, i) => (
          <motion.button
            key={text}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 + i * 0.05 }}
            onClick={() => onSuggestion(text)}
            className="group text-left text-sm px-4 py-3 rounded-xl border border-border bg-card hover:bg-secondary/50 hover:border-primary/30 transition-all text-muted-foreground hover:text-foreground flex items-start gap-2.5"
          >
            <span className="text-base opacity-60 group-hover:opacity-100 transition-opacity mt-px shrink-0">{icon}</span>
            <span className="leading-snug">{text}</span>
          </motion.button>
        ))}
      </motion.div>
    </div>
  )
}
