'use client'

/* eslint-disable react-hooks/set-state-in-effect --
   Inherited from the legacy /explore page. The effects set loading/clear flags
   before kicking off a fetch — an intentional, behavior-preserving pattern.
   (This page predates the rabbit-hole rebuild and will be revisited/retired.) */

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'motion/react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectGroup,
  SelectItem,
} from '@/components/ui/select'
import { FindingCards } from '@/components/gen-ui/finding-cards'
import { PatternList } from '@/components/gen-ui/pattern-list'
import { SourceTable } from '@/components/gen-ui/source-table'
import { SkillCards } from '@/components/gen-ui/skill-cards'
import { HealthDashboard } from '@/components/gen-ui/health-dashboard'
import type { Finding, Source, Pattern, Skill, HealthData } from '@/lib/types'
import {
  Search,
  FileText,
  Globe,
  TrendingUp,
  Lightbulb,
  Activity,
  Cpu,
  AlertCircle,
} from 'lucide-react'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function useDebounce(value: string, delay: number) {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(t)
  }, [value, delay])
  return debounced
}

async function proxyFetch<T>(path: string, params?: Record<string, string>): Promise<T> {
  const url = new URL(`/api/proxy/${path}`, window.location.origin)
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v) url.searchParams.set(k, v)
    })
  }
  const res = await fetch(url.toString())
  if (!res.ok) throw new Error(`Fetch failed: ${res.status}`)
  return res.json()
}

function LoadingSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="flex flex-col gap-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="text-primary font-mono font-bold text-xs">_</span>
          <Skeleton className="h-16 w-full" />
        </div>
      ))}
    </div>
  )
}

function ErrorMessage({ message }: { message: string }) {
  return (
    <Alert variant="destructive">
      <AlertCircle data-icon="inline-start" />
      <AlertDescription className="text-xs uppercase tracking-wider">
        [ERROR] {message}
      </AlertDescription>
    </Alert>
  )
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="rule-row p-10 text-center">
      <p className="type-kicker text-ink-soft">
        [NO RECORDS FOUND]
      </p>
      <p className="font-mono text-[11px] tracking-[0.08em] text-ink-faint mt-1">{message}</p>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Tab 1: Search
// ---------------------------------------------------------------------------

function SearchTab() {
  const [query, setQuery] = useState('')
  const debouncedQuery = useDebounce(query, 300)
  const [results, setResults] = useState<Finding[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setResults([])
      return
    }
    setLoading(true)
    setError(null)
    proxyFetch<Finding[]>('search', { q: debouncedQuery, limit: '20', user: 'ramsay' })
      .then(setResults)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [debouncedQuery])

  return (
    <div className="flex flex-col gap-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-ink-faint" />
        <Input
          placeholder="SEARCH ALL FINDINGS..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-9 h-10 font-mono uppercase tracking-[0.08em] text-xs placeholder:text-ink-faint"
        />
      </div>
      {loading && <LoadingSkeleton rows={4} />}
      {error && <ErrorMessage message={error} />}
      {!loading && !error && !debouncedQuery.trim() && (
        <EmptyState message="Type a query to search across all research findings" />
      )}
      {!loading && !error && debouncedQuery.trim() && results.length === 0 && (
        <EmptyState message="No results match your query" />
      )}
      {!loading && !error && results.length > 0 && <FindingCards data={results} />}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Tab 2: All Findings
// ---------------------------------------------------------------------------

function AllFindingsTab() {
  const [findings, setFindings] = useState<Finding[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [agentFilter, setAgentFilter] = useState('all')
  const [importanceFilter, setImportanceFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState('all')
  const [displayCount, setDisplayCount] = useState(20)

  const fetchFindings = useCallback(() => {
    setLoading(true)
    setError(null)
    const params: Record<string, string> = { user: 'ramsay' }
    if (agentFilter !== 'all') params.agent = agentFilter
    if (importanceFilter !== 'all') params.importance = importanceFilter
    if (dateFilter !== 'all') params.date = dateFilter
    proxyFetch<Finding[]>('findings', params)
      .then((data) => {
        setFindings(data)
        setDisplayCount(20)
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [agentFilter, importanceFilter, dateFilter])

  useEffect(() => {
    fetchFindings()
  }, [fetchFindings])

  const uniqueAgents = [...new Set(findings.map((f) => f.agent))].sort()
  const uniqueDates = [...new Set(findings.map((f) => f.run_date))].sort().reverse()
  const displayed = findings.slice(0, displayCount)

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-2">
        <Select value={agentFilter} onValueChange={(v) => setAgentFilter(v ?? 'all')}>
          <SelectTrigger size="sm" className="text-[10px] uppercase tracking-wider">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="all">All agents</SelectItem>
              {uniqueAgents.map((a) => (
                <SelectItem key={a} value={a}>
                  {a.replace('-researcher', '')}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
        <Select value={importanceFilter} onValueChange={(v) => setImportanceFilter(v ?? 'all')}>
          <SelectTrigger size="sm" className="text-[10px] uppercase tracking-wider">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="all">All importance</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
        <Select value={dateFilter} onValueChange={(v) => setDateFilter(v ?? 'all')}>
          <SelectTrigger size="sm" className="text-[10px] uppercase tracking-wider">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="all">All dates</SelectItem>
              {uniqueDates.map((d) => (
                <SelectItem key={d} value={d}>{d}</SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>

      {loading && <LoadingSkeleton rows={5} />}
      {error && <ErrorMessage message={error} />}
      {!loading && !error && findings.length === 0 && (
        <EmptyState message="No findings match your filters" />
      )}
      {!loading && !error && displayed.length > 0 && (
        <>
          <FindingCards data={displayed} />
          {displayCount < findings.length && (
            <button
              onClick={() => setDisplayCount((c) => c + 20)}
              className="type-kicker w-full py-2 text-ink transition-colors border border-ink bg-transparent hover:bg-panel"
            >
              Load more ({findings.length - displayCount} remaining)
            </button>
          )}
        </>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Tab 3: Sources
// ---------------------------------------------------------------------------

function SourcesTab() {
  const [sources, setSources] = useState<Source[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    proxyFetch<Source[]>('sources', { user: 'ramsay' })
      .then((data) => {
        setSources(data.sort((a, b) => b.high_value_count - a.high_value_count))
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <LoadingSkeleton rows={6} />
  if (error) return <ErrorMessage message={error} />
  if (!sources.length) return <EmptyState message="No sources tracked yet" />
  return <SourceTable data={sources} />
}

// ---------------------------------------------------------------------------
// Tab 4: Patterns
// ---------------------------------------------------------------------------

function PatternsTab() {
  const [patterns, setPatterns] = useState<Pattern[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    proxyFetch<Pattern[]>('patterns', { user: 'ramsay' })
      .then(setPatterns)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <LoadingSkeleton rows={5} />
  if (error) return <ErrorMessage message={error} />
  if (!patterns.length) return <EmptyState message="No patterns detected yet" />
  return <PatternList data={patterns} />
}

// ---------------------------------------------------------------------------
// Tab 5: Skills
// ---------------------------------------------------------------------------

function SkillsTab() {
  const [query, setQuery] = useState('')
  const debouncedQuery = useDebounce(query, 300)
  const [domainFilter, setDomainFilter] = useState('all')
  const [domains, setDomains] = useState<string[]>([])
  const [skills, setSkills] = useState<Skill[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    proxyFetch<string[]>('skill-domains', { user: 'ramsay' })
      .then((data) => setDomains(data.filter(Boolean)))
      .catch(() => {})
  }, [])

  useEffect(() => {
    setLoading(true)
    setError(null)
    if (debouncedQuery.trim()) {
      proxyFetch<Skill[]>('skills/search', {
        q: debouncedQuery,
        limit: '20',
        user: 'ramsay',
      })
        .then(setSkills)
        .catch((e) => setError(e.message))
        .finally(() => setLoading(false))
    } else {
      const params: Record<string, string> = { user: 'ramsay' }
      if (domainFilter !== 'all') params.domain = domainFilter
      proxyFetch<Skill[]>('skills', params)
        .then(setSkills)
        .catch((e) => setError(e.message))
        .finally(() => setLoading(false))
    }
  }, [debouncedQuery, domainFilter])

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-ink-faint" />
          <Input
            placeholder="SEARCH SKILLS..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9 h-8 font-mono uppercase tracking-[0.08em] text-xs placeholder:text-ink-faint"
          />
        </div>
        <Select value={domainFilter} onValueChange={(v) => setDomainFilter(v ?? 'all')}>
          <SelectTrigger size="sm" className="text-[10px] uppercase tracking-wider">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="all">All domains</SelectItem>
              {domains.map((d) => (
                <SelectItem key={d} value={d}>{d}</SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>
      {loading && <LoadingSkeleton rows={4} />}
      {error && <ErrorMessage message={error} />}
      {!loading && !error && skills.length === 0 && (
        <EmptyState message="No skills found" />
      )}
      {!loading && !error && skills.length > 0 && <SkillCards data={skills} />}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Tab 6: Health
// ---------------------------------------------------------------------------

function HealthTab() {
  const [health, setHealth] = useState<HealthData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    proxyFetch<HealthData>('health', { user: 'ramsay' })
      .then(setHealth)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="flex flex-col gap-4">
      <div className="rule-scotch pt-2">
        <h3 className="type-display text-[22px] font-[560] text-ink">System Health</h3>
        <p className="type-kicker text-ink-faint mt-1">
          Pipeline performance and agent activity
        </p>
      </div>
      {loading && <LoadingSkeleton rows={4} />}
      {error && <ErrorMessage message={error} />}
      {!loading && !error && health && <HealthDashboard data={health} />}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Tab 7: System (static)
// ---------------------------------------------------------------------------

const AGENT_TABLE = [
  { agent: 'news-researcher', focus: 'Breaking AI industry news', output: '5-8 findings', category: 'Web Search' },
  { agent: 'vibe-coding-researcher', focus: 'AI coding tools & patterns', output: '5-8 findings', category: 'Web Search' },
  { agent: 'thought-leaders-researcher', focus: 'Person-attributed AI takes', output: '5-8 findings', category: 'Web Search' },
  { agent: 'agents-researcher', focus: 'Agent frameworks & deployments', output: '5-8 findings', category: 'Web Search' },
  { agent: 'projects-researcher', focus: 'Hot repos, OSS apps, demos', output: '5-8 findings', category: 'Web Search' },
  { agent: 'sources-researcher', focus: 'Best newsletters, blogs, papers', output: '5-8 findings', category: 'Web Search' },
  { agent: 'saas-disruption-researcher', focus: 'AI displacing SaaS categories', output: '5-8 findings', category: 'Web Search' },
  { agent: 'skill-finder', focus: 'Actionable dev skills & techniques', output: '3-5 skills', category: 'Web Search' },
  { agent: 'hn-researcher', focus: 'Top HN stories (Algolia API)', output: '5-8 findings', category: 'API' },
  { agent: 'arxiv-researcher', focus: 'cs.AI / cs.LG / cs.CL papers', output: '5-8 findings', category: 'API' },
  { agent: 'github-pulse-researcher', focus: 'OSS repos gaining stars', output: '5-8 findings', category: 'API' },
  { agent: 'rss-researcher', focus: '15 authoritative AI feeds', output: '5-8 findings', category: 'RSS' },
  { agent: 'reddit-researcher', focus: 'r/ML, r/LocalLLaMA, r/SaaS', output: '5-8 findings', category: 'API' },
]

const CATEGORY_STYLE: Record<string, string> = {
  'Web Search': 'text-chart-4 bg-chart-4/10 border-chart-4/20',
  'API': 'text-chart-2 bg-chart-2/10 border-chart-2/20',
  'RSS': 'text-chart-3 bg-chart-3/10 border-chart-3/20',
}

const MEMORY_TABLES = [
  { table: 'findings', contents: 'Research discoveries + summaries', embedding: 'finding_embeddings', keys: 'run_date, agent, importance' },
  { table: 'skills', contents: 'Actionable techniques + steps', embedding: 'skill_embeddings', keys: 'run_date, domain, difficulty' },
  { table: 'patterns', contents: 'Recurring cross-agent themes', embedding: '--', keys: 'theme, recurrence_count' },
  { table: 'sources', contents: 'Domain reliability tracking', embedding: '--', keys: 'url_domain, high_value_count' },
  { table: 'user_feedback', contents: 'Thumbs + text on findings', embedding: '--', keys: 'finding_id, rating' },
  { table: 'user_preferences', contents: 'Topic interest weights', embedding: '--', keys: 'key, value' },
  { table: 'social_posts', contents: 'Generated social content', embedding: '--', keys: 'platform, status' },
  { table: 'social_feedback', contents: 'Engagement analytics', embedding: '--', keys: 'post_id, metric' },
  { table: 'engagements', contents: 'User interaction log', embedding: '--', keys: 'type, timestamp' },
]

function SystemTab() {
  return (
    <div className="flex flex-col gap-8">
      {/* Hero */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="rule-scotch pt-2">
        <h3 className="type-display text-[22px] font-[560] text-ink">System Architecture</h3>
        <p className="font-serif text-[15px] text-ink-soft mt-2 leading-relaxed max-w-3xl">
          MindPattern is a fully autonomous AI research pipeline that runs daily on macOS via launchd.
          It dispatches 13 parallel research agents, synthesizes findings into a newsletter, stores
          everything in a SQLite memory database with vector embeddings, and posts curated content to
          social media -- all without human intervention.
        </p>
      </motion.div>

      {/* Execution Flow */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
        <h4 className="type-kicker mb-3 text-ink">Execution Flow</h4>
        <div className="border border-line bg-surface p-5 overflow-x-auto">
          <pre className="text-[11px] leading-relaxed text-ink-soft">
            <code>{`launchd (7:00 AM daily)
+-- run-all-users.sh
    +-- caffeinate -i -s -w $$
    +-- run-user-research.sh {user}
    |   +-- python3 memory.py feedback fetch
    |   +-- claude -p orchestrator (opus, 30 turns)
    |       +-- Task: news-researcher          |
    |       +-- Task: vibe-coding-researcher    |
    |       +-- Task: thought-leaders           |
    |       +-- Task: agents-researcher         |
    |       +-- Task: projects-researcher       |
    |       +-- Task: sources-researcher        | all 13 parallel
    |       +-- Task: saas-disruption           |
    |       +-- Task: skill-finder              |
    |       +-- Task: hn-researcher             |
    |       +-- Task: arxiv-researcher          |
    |       +-- Task: github-pulse              |
    |       +-- Task: rss-researcher            |
    |       +-- Task: reddit-researcher         |
    +-- sync-to-fly.sh
    +-- run-social.sh {user}`}</code>
          </pre>
        </div>
      </motion.div>

      {/* Orchestrator Phases */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <h4 className="type-kicker mb-3 text-ink">Orchestrator Phases</h4>
        <div className="flex flex-col gap-3">
          {[
            { num: '1', title: 'Initialization', desc: 'Reads SOUL.md, vertical config, learnings.md, and user preferences from memory DB' },
            { num: '2', title: 'Coordinator', desc: 'Quick trend scan with 3 web searches to identify today\'s hot topics for agent context' },
            { num: '3', title: 'Dispatch', desc: '13 parallel agents dispatched in a single message -- each gets its skill file path, trending topics, and memory context' },
            { num: '4', title: 'Synthesis', desc: 'Collects all agent outputs, deduplicates findings, generates daily newsletter, stores to memory DB' },
            { num: '5', title: 'Self-Improvement', desc: 'Records cross-run patterns, updates learnings.md with distilled insights from the run' },
            { num: '5b', title: 'Agent Evolution', desc: 'Dynamic team adjustment -- can propose adding, merging, or retiring agents based on performance data' },
          ].map((phase) => (
            <div key={phase.num} className="rule-row flex gap-3 items-start pt-3">
              <span className="numeral-ghost text-[28px] w-9 shrink-0 text-right" aria-hidden>
                {phase.num}
              </span>
              <div>
                <p className="type-kicker text-ink">{phase.title}</p>
                <p className="font-serif text-[13px] text-ink-soft leading-relaxed">{phase.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Research Agents Table */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
        <h4 className="type-kicker mb-3 text-ink">Research Agents</h4>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr>
                <th className="text-left font-mono font-semibold text-[10px] text-ink uppercase tracking-[0.14em] px-4 py-2 border-b-2 border-ink">Agent</th>
                <th className="text-left font-mono font-semibold text-[10px] text-ink uppercase tracking-[0.14em] px-4 py-2 border-b-2 border-ink">Focus</th>
                <th className="text-left font-mono font-semibold text-[10px] text-ink uppercase tracking-[0.14em] px-4 py-2 border-b-2 border-ink">Output</th>
                <th className="text-left font-mono font-semibold text-[10px] text-ink uppercase tracking-[0.14em] px-4 py-2 border-b-2 border-ink">Category</th>
              </tr>
            </thead>
            <tbody>
              {AGENT_TABLE.map((a) => (
                <tr key={a.agent} className="border-b border-line last:border-0 hover:bg-spine">
                  <td className="px-4 py-2.5 font-mono font-semibold text-[11px] text-ink">{a.agent}</td>
                  <td className="px-4 py-2.5 text-ink-soft text-[11px]">{a.focus}</td>
                  <td className="px-4 py-2.5 text-ink-soft text-[11px]">{a.output}</td>
                  <td className="px-4 py-2.5">
                    <Badge variant="outline" className={`text-[10px] uppercase tracking-wider ${CATEGORY_STYLE[a.category] || ''}`}>
                      {a.category}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Memory Database Table */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <h4 className="type-kicker mb-3 text-ink">Memory Database</h4>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr>
                <th className="text-left font-mono font-semibold text-[10px] text-ink uppercase tracking-[0.14em] px-4 py-2 border-b-2 border-ink">Table</th>
                <th className="text-left font-mono font-semibold text-[10px] text-ink uppercase tracking-[0.14em] px-4 py-2 border-b-2 border-ink">Contents</th>
                <th className="text-left font-mono font-semibold text-[10px] text-ink uppercase tracking-[0.14em] px-4 py-2 border-b-2 border-ink">Embedding</th>
                <th className="text-left font-mono font-semibold text-[10px] text-ink uppercase tracking-[0.14em] px-4 py-2 border-b-2 border-ink">Key Columns</th>
              </tr>
            </thead>
            <tbody>
              {MEMORY_TABLES.map((t) => (
                <tr key={t.table} className="border-b border-line last:border-0 hover:bg-spine">
                  <td className="px-4 py-2.5 font-mono font-semibold text-[11px] text-primary">{t.table}</td>
                  <td className="px-4 py-2.5 text-ink-soft text-[11px]">{t.contents}</td>
                  <td className="px-4 py-2.5 text-[11px]">
                    {t.embedding === '--' ? (
                      <span className="text-ink-faint">--</span>
                    ) : (
                      <span className="font-mono text-ok">{t.embedding}</span>
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-ink-soft text-[11px]">{t.keys}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Social Media Pipeline */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
        <h4 className="type-kicker mb-3 text-ink">Social Media Pipeline</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { title: 'Curator', desc: 'Selects top findings for social posting using opus model, 15 turns. Analyzes engagement history and platform fit.', detail: 'opus / 15 turns', color: 'text-primary' },
            { title: 'Gate 1', desc: 'Sends curated selections to user via iMessage for approval before writing begins.', detail: 'iMessage approval', color: 'text-chart-4' },
            { title: 'Writers', desc: 'Generates platform-specific content with 3 self-critic rounds for quality. Adapts tone per platform.', detail: 'sonnet / 8 turns / 3 critic rounds', color: 'text-chart-2' },
            { title: 'Gate 2 + Post', desc: 'Final approval via iMessage, then automated posting to configured platforms.', detail: 'iMessage + auto-post', color: 'text-chart-4' },
          ].map((phase) => (
            <div key={phase.title} className="border border-line bg-surface p-4">
              <h5 className={`type-kicker ${phase.color}`}>{phase.title}</h5>
              <p className="font-serif text-[13px] text-ink-soft mt-1 leading-relaxed">{phase.desc}</p>
              <p className="type-kicker text-ink-faint mt-2">{phase.detail}</p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Cloud & Infrastructure */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <h4 className="type-kicker mb-3 text-ink">Cloud &amp; Infrastructure</h4>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="border border-line bg-surface p-4">
            <h5 className="type-kicker text-primary">Fly.io</h5>
            <p className="font-serif text-[13px] text-ink-soft mt-1 leading-relaxed">
              Hosts the Flask API + SQLite DB. Single machine in sjc region.
            </p>
          </div>
          <div className="border border-line bg-surface p-4">
            <h5 className="type-kicker text-chart-2">DB Sync</h5>
            <p className="font-serif text-[13px] text-ink-soft mt-1 leading-relaxed">
              After each run, sync-to-fly.sh uploads SQLite via sftp.
            </p>
          </div>
          <div className="border border-line bg-surface p-4">
            <h5 className="type-kicker text-chart-4">Email (Resend)</h5>
            <p className="font-serif text-[13px] text-ink-soft mt-1 leading-relaxed">
              Daily newsletter delivered via Resend API. HTML-formatted.
            </p>
          </div>
        </div>
      </motion.div>

      {/* File Map */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
        <h4 className="type-kicker mb-3 text-ink">File Map</h4>
        <div className="border border-line bg-surface p-5 overflow-x-auto">
          <pre className="text-[11px] leading-relaxed text-ink-soft">
            <code>{`daily-research-agent/
+-- run-all-users.sh        # Entry point (launchd)
+-- run-user-research.sh    # Per-user orchestration
+-- run-social.sh           # Social media pipeline
+-- sync-to-fly.sh          # DB upload to Fly.io
+-- memory.py               # SQLite + embeddings CLI
+-- users.json              # User registry
+-- verticals/
|   +-- ai-tech/
|       +-- SOUL.md         # Vertical identity
|       +-- vertical.json   # Agent config
|       +-- agents/         # 13 agent skill files
+-- tools/
|   +-- hn-fetch.py         # Hacker News API
|   +-- arxiv-fetch.py      # arXiv API
|   +-- github-fetch.py     # GitHub Search API
|   +-- rss-fetch.py        # RSS feed parser
|   +-- reddit-fetch.py     # Reddit JSON API
+-- data/                   # Per-user data
|   +-- ramsay/
|       +-- memory.db       # SQLite database
|       +-- learnings.md    # Distilled insights
+-- reports/                # Daily outputs
+-- frontend/               # This Next.js app`}</code>
          </pre>
        </div>
      </motion.div>

      {/* Tech Stack */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
        <h4 className="type-kicker mb-3 text-ink">Tech Stack</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {[
            { title: 'Core AI', desc: 'Claude CLI for orchestration. Opus for orchestrator + curator, Sonnet for writers. AI SDK for chat.' },
            { title: 'macOS System', desc: 'launchd scheduling, caffeinate, osascript for iMessage, Shortcuts for social posting.' },
            { title: 'Social & Infra', desc: 'Resend for email, Fly.io for hosting, sftp for DB sync, iMessage for approval gates.' },
            { title: 'Research APIs', desc: 'HN Algolia, arXiv export, GitHub Search, Reddit JSON, RSS/Atom feeds.' },
            { title: 'Shell & Python', desc: 'Bash for pipeline orchestration, Python 3.9 for fetcher tools and memory.py CLI.' },
            { title: 'Frontend', desc: 'Next.js 16, React 19, Tailwind CSS 4, AI SDK, shadcn/ui, Motion.' },
          ].map((item) => (
            <div key={item.title} className="border border-line bg-surface p-4">
              <h5 className="type-kicker text-ink">{item.title}</h5>
              <p className="font-serif text-[13px] text-ink-soft mt-1 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main: ExploreTabs
// ---------------------------------------------------------------------------

const TAB_ITEMS = [
  { value: 'search', label: 'Search', icon: Search },
  { value: 'findings', label: 'Findings', icon: FileText },
  { value: 'sources', label: 'Sources', icon: Globe },
  { value: 'patterns', label: 'Patterns', icon: TrendingUp },
  { value: 'skills', label: 'Skills', icon: Lightbulb },
  { value: 'health', label: 'Health', icon: Activity },
  { value: 'system', label: 'System', icon: Cpu },
] as const

export function ExploreTabs() {
  return (
    <Tabs defaultValue="search">
      <TabsList className="h-auto w-full justify-start overflow-x-auto flex-nowrap gap-0 bg-transparent p-0 border-b border-line">
        {TAB_ITEMS.map(({ value, label, icon: Icon }) => (
          <TabsTrigger
            key={value}
            value={value}
            className="h-auto gap-1.5 px-3 py-2 font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-soft border-0 border-b-2 border-transparent -mb-px hover:text-ink data-active:border-ink data-active:bg-transparent data-active:text-ink"
          >
            <Icon data-icon="inline-start" />
            <span className="hidden sm:inline">{label}</span>
          </TabsTrigger>
        ))}
      </TabsList>

      <div className="mt-4">
        <TabsContent value="search"><SearchTab /></TabsContent>
        <TabsContent value="findings"><AllFindingsTab /></TabsContent>
        <TabsContent value="sources"><SourcesTab /></TabsContent>
        <TabsContent value="patterns"><PatternsTab /></TabsContent>
        <TabsContent value="skills"><SkillsTab /></TabsContent>
        <TabsContent value="health"><HealthTab /></TabsContent>
        <TabsContent value="system"><SystemTab /></TabsContent>
      </div>
    </Tabs>
  )
}
