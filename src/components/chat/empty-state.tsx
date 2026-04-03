'use client'

import { motion } from 'motion/react'
import { AGENTS } from '@/lib/constants'

const DIRECTIVES = [
  { code: 'DIR-01', text: 'Show me the stats' },
  { code: 'DIR-02', text: 'What patterns are trending?' },
  { code: 'DIR-03', text: "Show me today's findings" },
  { code: 'DIR-04', text: 'What are the top sources?' },
  { code: 'DIR-05', text: 'Show me the latest report' },
  { code: 'DIR-06', text: 'Search findings about AI agents' },
]

export function EmptyState({ onSuggestion }: { onSuggestion: (text: string) => void }) {
  return (
    <div className="flex flex-col items-center py-8 sm:py-12 px-4 max-w-2xl mx-auto w-full">
      {/* ── HERO ── */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-10"
      >
        <div className="relative mx-auto mb-5 inline-block">
          <div className="border-2 border-primary px-6 py-3 stamp">
            <span className="text-primary text-base sm:text-lg font-bold tracking-[0.2em]">
              MINDPATTERN
            </span>
          </div>
        </div>
        <p className="text-foreground text-xs sm:text-sm font-bold uppercase tracking-[0.12em] mb-4">
          Your AI Research Analyst
        </p>
        <p className="text-muted-foreground text-xs leading-[1.8] max-w-lg mx-auto">
          MindPattern is an autonomous research pipeline that monitors the AI
          ecosystem every day. 13 specialized agents scan news, academic papers,
          GitHub, Reddit, Hacker News, arXiv, RSS feeds, and expert commentary —
          then synthesize everything into a searchable intelligence database.
        </p>
        <p className="text-muted-foreground text-xs leading-[1.8] max-w-lg mx-auto mt-3">
          This is the conversational interface. Ask a question and get
          data-grounded answers with interactive charts, cards, and tables —
          powered by real findings, not hallucinations.
        </p>
      </motion.section>

      {/* ── HOW IT WORKS ── */}
      <motion.section
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="w-full mb-10"
      >
        <div className="flex items-center gap-3 mb-4">
          <span className="text-[10px] text-primary font-bold uppercase tracking-[0.2em]">
            01
          </span>
          <h2 className="text-[11px] font-bold uppercase tracking-[0.15em] text-foreground">
            How It Works
          </h2>
          <div className="flex-1 border-t border-border" />
        </div>

        <div className="text-muted-foreground text-xs leading-[1.8] space-y-3 mb-5">
          <p>
            Every morning at 0700, the pipeline deploys <strong className="text-foreground">13
            parallel research agents</strong>. Each one specializes in a different slice of the
            AI landscape:
          </p>
        </div>

        <div className="flex flex-wrap gap-1.5 mb-5">
          {AGENTS.map((agent, i) => (
            <motion.span
              key={agent.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.25 + i * 0.03 }}
              className="text-[10px] uppercase tracking-wider px-2 py-1 bg-muted text-muted-foreground border border-border"
            >
              {agent.name}
            </motion.span>
          ))}
        </div>

        <div className="text-muted-foreground text-xs leading-[1.8] space-y-3">
          <p>
            Findings are deduplicated, scored for importance, and stored in a
            vector-embedded database. The system tracks recurring{' '}
            <strong className="text-foreground">patterns</strong> across runs,
            extracts actionable <strong className="text-foreground">developer skills</strong>,
            and generates a daily <strong className="text-foreground">3,000–5,000 word
            intelligence briefing</strong> archived at{' '}
            <a href="/blog" className="text-navy underline underline-offset-2 hover:text-primary transition-colors">/briefings</a>.
          </p>
          <p>
            The pipeline self-improves — agents learn from their own outputs,
            pattern recurrence is tracked with semantic dedup, and feedback
            adjusts what the system prioritizes next.
          </p>
        </div>
      </motion.section>

      {/* ── WHAT YOU CAN ASK ── */}
      <motion.section
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        className="w-full mb-10"
      >
        <div className="flex items-center gap-3 mb-4">
          <span className="text-[10px] text-primary font-bold uppercase tracking-[0.2em]">
            02
          </span>
          <h2 className="text-[11px] font-bold uppercase tracking-[0.15em] text-foreground">
            What You Can Ask
          </h2>
          <div className="flex-1 border-t border-border" />
        </div>

        <ul className="text-muted-foreground text-xs leading-[1.8] space-y-1.5 list-none">
          <li>
            <strong className="text-foreground">Search findings</strong> — semantic
            vector search across thousands of research entries
          </li>
          <li>
            <strong className="text-foreground">Track patterns</strong> — recurring
            themes the system has identified across daily runs
          </li>
          <li>
            <strong className="text-foreground">Read daily reports</strong> — full
            intelligence briefings, searchable and archived
          </li>
          <li>
            <strong className="text-foreground">Discover skills</strong> — actionable
            developer techniques extracted from the landscape
          </li>
          <li>
            <strong className="text-foreground">Check system health</strong> — pipeline
            quality scores, agent activity, error tracking
          </li>
          <li>
            <strong className="text-foreground">Explore sources</strong> — see which
            newsletters, blogs, and feeds produce the highest-signal content
          </li>
        </ul>
      </motion.section>

      {/* ── EXPLORE THE SYSTEM ── */}
      <motion.section
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45 }}
        className="w-full mb-10"
      >
        <div className="flex items-center gap-3 mb-4">
          <span className="text-[10px] text-primary font-bold uppercase tracking-[0.2em]">
            03
          </span>
          <h2 className="text-[11px] font-bold uppercase tracking-[0.15em] text-foreground">
            Three Ways In
          </h2>
          <div className="flex-1 border-t border-border" />
        </div>

        <div className="space-y-4 text-xs leading-[1.8] text-muted-foreground">
          <div>
            <strong className="text-foreground">This chat</strong> — the conversational
            interface. Ask anything in natural language and get data-grounded answers
            with inline charts, cards, and tables. The AI calls into the research
            database on every query — it never guesses.
          </div>

          <div>
            <a href="/blog" className="text-navy underline underline-offset-2 hover:text-primary transition-colors font-bold">
              Briefings
            </a>{' '}
            — the daily intelligence reports. Every pipeline run produces a 3,000–5,000
            word briefing covering top stories, breaking news, vibe coding updates,
            agent frameworks, security alerts, and thought leader takes. Fully
            searchable, delivered by email if you subscribe.
          </div>

          <div>
            <a href="/explore" className="text-navy underline underline-offset-2 hover:text-primary transition-colors font-bold">
              Archives
            </a>{' '}
            — the raw research database, browsable without chat. Seven views into the
            data:
          </div>

          <ul className="list-none space-y-1 ml-4">
            <li>
              <strong className="text-foreground">Search</strong> — semantic vector
              search across all findings
            </li>
            <li>
              <strong className="text-foreground">All Findings</strong> — browse
              every entry, filter by agent, importance, or date
            </li>
            <li>
              <strong className="text-foreground">Sources</strong> — ranked table of
              where the best intel comes from (domain, hit count, quality)
            </li>
            <li>
              <strong className="text-foreground">Patterns</strong> — recurring
              themes tracked across pipeline runs
            </li>
            <li>
              <strong className="text-foreground">Skills</strong> — actionable
              developer techniques by domain and difficulty
            </li>
            <li>
              <strong className="text-foreground">Health</strong> — pipeline quality
              trend, per-agent activity, error log
            </li>
            <li>
              <strong className="text-foreground">System</strong> — agent roster,
              pipeline architecture, run schedule
            </li>
          </ul>
        </div>
      </motion.section>

      {/* ── DIRECTIVES ── */}
      <motion.section
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="w-full"
      >
        <div className="flex items-center gap-3 mb-4">
          <span className="text-[10px] text-primary font-bold uppercase tracking-[0.2em]">
            04
          </span>
          <h2 className="text-[11px] font-bold uppercase tracking-[0.15em] text-foreground">
            Issue a Directive
          </h2>
          <div className="flex-1 border-t border-border" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {DIRECTIVES.map(({ code, text }, i) => (
            <motion.button
              key={text}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 + i * 0.04 }}
              onClick={() => onSuggestion(text)}
              className="group text-left text-xs px-4 py-3 border border-border bg-card dossier-card hover:border-primary/50 transition-all text-foreground flex items-start gap-3 cursor-pointer"
            >
              <span className="text-[10px] text-primary font-bold uppercase tracking-wider shrink-0 mt-px">
                {code}
              </span>
              <span className="leading-snug text-muted-foreground group-hover:text-foreground transition-colors">
                {text}
              </span>
            </motion.button>
          ))}
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.0 }}
          className="text-center text-[10px] text-muted-foreground/50 uppercase tracking-[0.2em] mt-8 mb-2"
        >
          System online &middot; 13 agents reporting &middot; type your own query below
        </motion.p>
      </motion.section>
    </div>
  )
}
