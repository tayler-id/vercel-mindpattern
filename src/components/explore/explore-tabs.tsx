'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion } from 'motion/react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { FindingCards } from '@/components/gen-ui/finding-cards'
import { PatternList } from '@/components/gen-ui/pattern-list'
import { SourceTable } from '@/components/gen-ui/source-table'
import { SkillCards } from '@/components/gen-ui/skill-cards'
import { HealthDashboard } from '@/components/gen-ui/health-dashboard'
import { AGENTS } from '@/lib/constants'
import type { Finding, Source, Pattern, Skill, HealthData } from '@/lib/types'
import {
  Search,
  FileText,
  Globe,
  TrendingUp,
  Lightbulb,
  Activity,
  Cpu,
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
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-20 w-full rounded-xl" />
      ))}
    </div>
  )
}

function ErrorMessage({ message }: { message: string }) {
  return (
    <div className="bg-card border border-red-400/20 rounded-xl p-6 text-center">
      <p className="text-sm text-red-400">{message}</p>
    </div>
  )
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="bg-card border border-border rounded-xl p-10 text-center">
      <p className="text-sm text-muted-foreground">{message}</p>
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
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input
          placeholder="Search across all research findings..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-9 h-10"
        />
      </div>
      {loading && <LoadingSkeleton rows={4} />}
      {error && <ErrorMessage message={error} />}
      {!loading && !error && !debouncedQuery.trim() && (
        <EmptyState message="Type a query to search across all research findings" />
      )}
      {!loading && !error && debouncedQuery.trim() && results.length === 0 && (
        <EmptyState message="No results found" />
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

  const [agentFilter, setAgentFilter] = useState('')
  const [importanceFilter, setImportanceFilter] = useState('')
  const [dateFilter, setDateFilter] = useState('')
  const [displayCount, setDisplayCount] = useState(20)

  const fetchFindings = useCallback(() => {
    setLoading(true)
    setError(null)
    const params: Record<string, string> = { user: 'ramsay' }
    if (agentFilter) params.agent = agentFilter
    if (importanceFilter) params.importance = importanceFilter
    if (dateFilter) params.date = dateFilter
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
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <select
          value={agentFilter}
          onChange={(e) => setAgentFilter(e.target.value)}
          className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm text-foreground focus:border-ring focus:ring-1 focus:ring-ring/50 outline-none"
        >
          <option value="">All agents</option>
          {uniqueAgents.map((a) => (
            <option key={a} value={a}>
              {a.replace('-researcher', '')}
            </option>
          ))}
        </select>
        <select
          value={importanceFilter}
          onChange={(e) => setImportanceFilter(e.target.value)}
          className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm text-foreground focus:border-ring focus:ring-1 focus:ring-ring/50 outline-none"
        >
          <option value="">All importance</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
        <select
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm text-foreground focus:border-ring focus:ring-1 focus:ring-ring/50 outline-none"
        >
          <option value="">All dates</option>
          {uniqueDates.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
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
              className="w-full py-2 text-sm text-primary hover:text-primary/80 transition-colors"
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
  const [domainFilter, setDomainFilter] = useState('')
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
      if (domainFilter) params.domain = domainFilter
      proxyFetch<Skill[]>('skills', params)
        .then(setSkills)
        .catch((e) => setError(e.message))
        .finally(() => setLoading(false))
    }
  }, [debouncedQuery, domainFilter])

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Search skills..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9 h-8"
          />
        </div>
        <select
          value={domainFilter}
          onChange={(e) => setDomainFilter(e.target.value)}
          className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm text-foreground focus:border-ring focus:ring-1 focus:ring-ring/50 outline-none"
        >
          <option value="">All domains</option>
          {domains.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
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
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold">System Health</h3>
        <p className="text-sm text-muted-foreground">Pipeline performance and agent activity</p>
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
  { agent: 'news-researcher', focus: 'Breaking AI industry news', output: '5-8 findings', category: 'Web Search', color: 'text-blue-400 bg-blue-400/10 border-blue-400/20' },
  { agent: 'vibe-coding-researcher', focus: 'AI coding tools & patterns', output: '5-8 findings', category: 'Web Search', color: 'text-blue-400 bg-blue-400/10 border-blue-400/20' },
  { agent: 'thought-leaders-researcher', focus: 'Person-attributed AI takes', output: '5-8 findings', category: 'Web Search', color: 'text-blue-400 bg-blue-400/10 border-blue-400/20' },
  { agent: 'agents-researcher', focus: 'Agent frameworks & deployments', output: '5-8 findings', category: 'Web Search', color: 'text-blue-400 bg-blue-400/10 border-blue-400/20' },
  { agent: 'projects-researcher', focus: 'Hot repos, OSS apps, demos', output: '5-8 findings', category: 'Web Search', color: 'text-blue-400 bg-blue-400/10 border-blue-400/20' },
  { agent: 'sources-researcher', focus: 'Best newsletters, blogs, papers', output: '5-8 findings', category: 'Web Search', color: 'text-blue-400 bg-blue-400/10 border-blue-400/20' },
  { agent: 'saas-disruption-researcher', focus: 'AI displacing SaaS categories', output: '5-8 findings', category: 'Web Search', color: 'text-blue-400 bg-blue-400/10 border-blue-400/20' },
  { agent: 'skill-finder', focus: 'Actionable dev skills & techniques', output: '3-5 skills', category: 'Web Search', color: 'text-blue-400 bg-blue-400/10 border-blue-400/20' },
  { agent: 'hn-researcher', focus: 'Top HN stories (Algolia API)', output: '5-8 findings', category: 'API', color: 'text-green-400 bg-green-400/10 border-green-400/20' },
  { agent: 'arxiv-researcher', focus: 'cs.AI / cs.LG / cs.CL papers', output: '5-8 findings', category: 'API', color: 'text-green-400 bg-green-400/10 border-green-400/20' },
  { agent: 'github-pulse-researcher', focus: 'OSS repos gaining stars', output: '5-8 findings', category: 'API', color: 'text-green-400 bg-green-400/10 border-green-400/20' },
  { agent: 'rss-researcher', focus: '15 authoritative AI feeds', output: '5-8 findings', category: 'RSS', color: 'text-amber-400 bg-yellow-400/10 border-yellow-400/20' },
  { agent: 'reddit-researcher', focus: 'r/ML, r/LocalLLaMA, r/SaaS', output: '5-8 findings', category: 'API', color: 'text-green-400 bg-green-400/10 border-green-400/20' },
]

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
    <div className="space-y-8">
      {/* Hero */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <h3 className="text-2xl font-bold tracking-tight text-foreground">System Architecture</h3>
        <p className="text-muted-foreground mt-2 leading-relaxed max-w-3xl">
          MindPattern is a fully autonomous AI research pipeline that runs daily on macOS via launchd.
          It dispatches 13 parallel research agents, synthesizes findings into a newsletter, stores
          everything in a SQLite memory database with vector embeddings, and posts curated content to
          social media — all without human intervention.
        </p>
      </motion.div>

      {/* Execution Flow */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
        <h4 className="text-lg font-semibold mb-3 text-foreground">Execution Flow</h4>
        <div className="bg-[#0a0e14] border border-border rounded-xl p-5 overflow-x-auto">
          <pre className="text-sm font-mono leading-relaxed text-muted-foreground">
            <code>{`launchd (7:00 AM daily)
└── run-all-users.sh
    ├── caffeinate -i -s -w $$
    ├── run-user-research.sh {user}
    │   ├── python3 memory.py feedback fetch
    │   └── claude -p orchestrator (opus, 30 turns)
    │       ├── Task: news-researcher          ┐
    │       ├── Task: vibe-coding-researcher    │
    │       ├── Task: thought-leaders           │
    │       ├── Task: agents-researcher         │
    │       ├── Task: projects-researcher       │
    │       ├── Task: sources-researcher        │ all 13 parallel
    │       ├── Task: saas-disruption           │
    │       ├── Task: skill-finder              │
    │       ├── Task: hn-researcher             │
    │       ├── Task: arxiv-researcher          │
    │       ├── Task: github-pulse              │
    │       ├── Task: rss-researcher            │
    │       └── Task: reddit-researcher         ┘
    ├── sync-to-fly.sh
    └── run-social.sh {user}`}</code>
          </pre>
        </div>
      </motion.div>

      {/* Orchestrator Phases */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <h4 className="text-lg font-semibold mb-3 text-foreground">Orchestrator Phases</h4>
        <div className="space-y-3">
          {[
            { num: '1', title: 'Initialization', desc: 'Reads SOUL.md, vertical config, learnings.md, and user preferences from memory DB' },
            { num: '2', title: 'Coordinator', desc: 'Quick trend scan with 3 web searches to identify today\'s hot topics for agent context' },
            { num: '3', title: 'Dispatch', desc: '13 parallel agents dispatched in a single message — each gets its skill file path, trending topics, and memory context' },
            { num: '4', title: 'Synthesis', desc: 'Collects all agent outputs, deduplicates findings, generates daily newsletter, stores to memory DB' },
            { num: '5', title: 'Self-Improvement', desc: 'Records cross-run patterns, updates learnings.md with distilled insights from the run' },
            { num: '5b', title: 'Agent Evolution', desc: 'Dynamic team adjustment — can propose adding, merging, or retiring agents based on performance data' },
          ].map((phase) => (
            <div key={phase.num} className="flex gap-3 items-start">
              <span className="flex items-center justify-center size-7 rounded-full bg-primary/15 text-primary text-xs font-bold shrink-0 mt-0.5">
                {phase.num}
              </span>
              <div>
                <p className="text-sm font-medium text-foreground">{phase.title}</p>
                <p className="text-xs text-muted-foreground leading-relaxed">{phase.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Research Agents Table */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
        <h4 className="text-lg font-semibold mb-3 text-foreground">Research Agents</h4>
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left text-xs text-muted-foreground font-medium px-4 py-2">Agent</th>
                <th className="text-left text-xs text-muted-foreground font-medium px-4 py-2">Focus</th>
                <th className="text-left text-xs text-muted-foreground font-medium px-4 py-2">Output</th>
                <th className="text-left text-xs text-muted-foreground font-medium px-4 py-2">Category</th>
              </tr>
            </thead>
            <tbody>
              {AGENT_TABLE.map((a) => (
                <tr key={a.agent} className="border-b border-border/50 last:border-0 hover:bg-muted/30">
                  <td className="px-4 py-2.5 font-medium font-mono text-xs text-foreground">{a.agent}</td>
                  <td className="px-4 py-2.5 text-muted-foreground text-xs">{a.focus}</td>
                  <td className="px-4 py-2.5 text-muted-foreground text-xs">{a.output}</td>
                  <td className="px-4 py-2.5">
                    <Badge variant="outline" className={`text-[10px] ${a.color}`}>
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
        <h4 className="text-lg font-semibold mb-3 text-foreground">Memory Database</h4>
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left text-xs text-muted-foreground font-medium px-4 py-2">Table</th>
                <th className="text-left text-xs text-muted-foreground font-medium px-4 py-2">Contents</th>
                <th className="text-left text-xs text-muted-foreground font-medium px-4 py-2">Embedding Table</th>
                <th className="text-left text-xs text-muted-foreground font-medium px-4 py-2">Key Columns</th>
              </tr>
            </thead>
            <tbody>
              {MEMORY_TABLES.map((t) => (
                <tr key={t.table} className="border-b border-border/50 last:border-0 hover:bg-muted/30">
                  <td className="px-4 py-2.5 font-medium font-mono text-xs text-primary">{t.table}</td>
                  <td className="px-4 py-2.5 text-muted-foreground text-xs">{t.contents}</td>
                  <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground">
                    {t.embedding === '--' ? (
                      <span className="text-muted-foreground/40">--</span>
                    ) : (
                      <span className="text-green-400">{t.embedding}</span>
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-muted-foreground text-xs">{t.keys}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Social Media Pipeline */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
        <h4 className="text-lg font-semibold mb-3 text-foreground">Social Media Pipeline</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            {
              title: 'Curator',
              desc: 'Selects top findings for social posting using opus model, 15 turns. Analyzes engagement history and platform fit.',
              detail: 'opus / 15 turns',
              color: 'text-primary',
            },
            {
              title: 'Gate 1',
              desc: 'Sends curated selections to user via iMessage for approval before writing begins.',
              detail: 'iMessage approval',
              color: 'text-amber-400',
            },
            {
              title: 'Writers',
              desc: 'Generates platform-specific content with 3 self-critic rounds for quality. Adapts tone per platform.',
              detail: 'sonnet / 8 turns / 3 critic rounds',
              color: 'text-green-400',
            },
            {
              title: 'Gate 2 + Post',
              desc: 'Final approval via iMessage, then automated posting to configured platforms.',
              detail: 'iMessage + auto-post',
              color: 'text-amber-400',
            },
          ].map((phase) => (
            <div key={phase.title} className="bg-card border border-border rounded-xl p-4">
              <h5 className={`text-sm font-semibold ${phase.color}`}>{phase.title}</h5>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{phase.desc}</p>
              <p className="text-[11px] text-muted-foreground/60 mt-2 font-mono">{phase.detail}</p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Cloud & Infrastructure */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <h4 className="text-lg font-semibold mb-3 text-foreground">Cloud &amp; Infrastructure</h4>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-card border border-border rounded-xl p-4">
            <h5 className="text-sm font-semibold text-primary">Fly.io</h5>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
              Hosts the Flask API + SQLite DB. Single machine in sjc region. Serves the REST API consumed by this frontend and the chat interface.
            </p>
          </div>
          <div className="bg-card border border-border rounded-xl p-4">
            <h5 className="text-sm font-semibold text-green-400">DB Sync</h5>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
              After each run, sync-to-fly.sh uploads the local SQLite database to the Fly.io volume via sftp, ensuring the cloud API always has fresh data.
            </p>
          </div>
          <div className="bg-card border border-border rounded-xl p-4">
            <h5 className="text-sm font-semibold text-amber-400">Email (Resend)</h5>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
              Daily newsletter delivered via Resend API. HTML-formatted email with all findings, patterns, and skills from the day.
            </p>
          </div>
        </div>
      </motion.div>

      {/* File Map */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
        <h4 className="text-lg font-semibold mb-3 text-foreground">File Map</h4>
        <div className="bg-[#0a0e14] border border-border rounded-xl p-5 overflow-x-auto">
          <pre className="text-sm font-mono leading-relaxed">
            <code>
              <span className="text-primary">daily-research-agent/</span>{'\n'}
              <span className="text-muted-foreground">├── </span><span className="text-amber-400">run-all-users.sh</span><span className="text-muted-foreground">        # Entry point (launchd)</span>{'\n'}
              <span className="text-muted-foreground">├── </span><span className="text-amber-400">run-user-research.sh</span><span className="text-muted-foreground">    # Per-user orchestration</span>{'\n'}
              <span className="text-muted-foreground">├── </span><span className="text-amber-400">run-social.sh</span><span className="text-muted-foreground">           # Social media pipeline</span>{'\n'}
              <span className="text-muted-foreground">├── </span><span className="text-amber-400">sync-to-fly.sh</span><span className="text-muted-foreground">          # DB upload to Fly.io</span>{'\n'}
              <span className="text-muted-foreground">├── </span><span className="text-green-400">memory.py</span><span className="text-muted-foreground">               # SQLite + embeddings CLI</span>{'\n'}
              <span className="text-muted-foreground">├── </span><span className="text-green-400">users.json</span><span className="text-muted-foreground">              # User registry</span>{'\n'}
              <span className="text-muted-foreground">├── </span><span className="text-primary">verticals/</span>{'\n'}
              <span className="text-muted-foreground">│   └── </span><span className="text-primary">ai-tech/</span>{'\n'}
              <span className="text-muted-foreground">│       ├── </span><span className="text-muted-foreground">SOUL.md</span><span className="text-muted-foreground">             # Vertical identity</span>{'\n'}
              <span className="text-muted-foreground">│       ├── </span><span className="text-muted-foreground">vertical.json</span><span className="text-muted-foreground">       # Agent config</span>{'\n'}
              <span className="text-muted-foreground">│       └── </span><span className="text-primary">agents/</span><span className="text-muted-foreground">             # 13 agent skill files</span>{'\n'}
              <span className="text-muted-foreground">├── </span><span className="text-primary">tools/</span>{'\n'}
              <span className="text-muted-foreground">│   ├── </span><span className="text-green-400">hn-fetch.py</span><span className="text-muted-foreground">             # Hacker News API</span>{'\n'}
              <span className="text-muted-foreground">│   ├── </span><span className="text-green-400">arxiv-fetch.py</span><span className="text-muted-foreground">          # arXiv API</span>{'\n'}
              <span className="text-muted-foreground">│   ├── </span><span className="text-green-400">github-fetch.py</span><span className="text-muted-foreground">         # GitHub Search API</span>{'\n'}
              <span className="text-muted-foreground">│   ├── </span><span className="text-green-400">rss-fetch.py</span><span className="text-muted-foreground">            # RSS feed parser</span>{'\n'}
              <span className="text-muted-foreground">│   └── </span><span className="text-green-400">reddit-fetch.py</span><span className="text-muted-foreground">         # Reddit JSON API</span>{'\n'}
              <span className="text-muted-foreground">├── </span><span className="text-primary">data/</span><span className="text-muted-foreground">                   # Per-user data</span>{'\n'}
              <span className="text-muted-foreground">│   └── </span><span className="text-primary">ramsay/</span>{'\n'}
              <span className="text-muted-foreground">│       ├── </span><span className="text-muted-foreground">memory.db</span><span className="text-muted-foreground">           # SQLite database</span>{'\n'}
              <span className="text-muted-foreground">│       ├── </span><span className="text-muted-foreground">learnings.md</span><span className="text-muted-foreground">        # Distilled insights</span>{'\n'}
              <span className="text-muted-foreground">│       └── </span><span className="text-muted-foreground">learnings-archive.md</span><span className="text-muted-foreground">  # Full run history</span>{'\n'}
              <span className="text-muted-foreground">├── </span><span className="text-primary">reports/</span><span className="text-muted-foreground">                # Daily outputs</span>{'\n'}
              <span className="text-muted-foreground">└── </span><span className="text-primary">frontend/</span><span className="text-muted-foreground">               # This Next.js app</span>
            </code>
          </pre>
        </div>
      </motion.div>

      {/* Tech Stack */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
        <h4 className="text-lg font-semibold mb-3 text-foreground">Tech Stack</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <div className="bg-card border border-border rounded-xl p-4">
            <h5 className="text-sm font-semibold text-primary">Core AI</h5>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
              Claude CLI (claude -p) for orchestration. Opus for orchestrator + curator, Sonnet for writers. AI SDK for chat frontend.
            </p>
          </div>
          <div className="bg-card border border-border rounded-xl p-4">
            <h5 className="text-sm font-semibold text-green-400">macOS System APIs</h5>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
              launchd for scheduling, caffeinate for preventing sleep, osascript for iMessage integration, Shortcuts for social posting.
            </p>
          </div>
          <div className="bg-card border border-border rounded-xl p-4">
            <h5 className="text-sm font-semibold text-amber-400">Social &amp; Infrastructure</h5>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
              Resend for email, Fly.io for hosting, sftp for DB sync, iMessage for human-in-the-loop approval gates.
            </p>
          </div>
          <div className="bg-card border border-border rounded-xl p-4">
            <h5 className="text-sm font-semibold text-red-400">Research APIs</h5>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
              HN Algolia, arXiv export, GitHub Search, Reddit JSON, RSS/Atom feeds. All unauthenticated or minimal auth.
            </p>
          </div>
          <div className="bg-card border border-border rounded-xl p-4">
            <h5 className="text-sm font-semibold text-purple-400">Shell &amp; Python</h5>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
              Bash scripts for pipeline orchestration, Python 3.9 for fetcher tools and memory.py CLI with SQLite + sqlite-vec.
            </p>
          </div>
          <div className="bg-card border border-border rounded-xl p-4">
            <h5 className="text-sm font-semibold text-primary">Frontend</h5>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
              Next.js 16, React 19, Tailwind CSS 4, AI SDK for streaming chat, shadcn/ui components, Motion for animations.
            </p>
          </div>
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
  { value: 'findings', label: 'All Findings', icon: FileText },
  { value: 'sources', label: 'Sources', icon: Globe },
  { value: 'patterns', label: 'Patterns', icon: TrendingUp },
  { value: 'skills', label: 'Skills', icon: Lightbulb },
  { value: 'health', label: 'Health', icon: Activity },
  { value: 'system', label: 'System', icon: Cpu },
] as const

export function ExploreTabs() {
  return (
    <Tabs defaultValue="search">
      <TabsList className="w-full justify-start overflow-x-auto flex-nowrap gap-0">
        {TAB_ITEMS.map(({ value, label, icon: Icon }) => (
          <TabsTrigger key={value} value={value} className="gap-1.5 px-3">
            <Icon className="size-3.5" />
            <span className="hidden sm:inline">{label}</span>
          </TabsTrigger>
        ))}
      </TabsList>

      <div className="mt-4">
        <TabsContent value="search">
          <SearchTab />
        </TabsContent>
        <TabsContent value="findings">
          <AllFindingsTab />
        </TabsContent>
        <TabsContent value="sources">
          <SourcesTab />
        </TabsContent>
        <TabsContent value="patterns">
          <PatternsTab />
        </TabsContent>
        <TabsContent value="skills">
          <SkillsTab />
        </TabsContent>
        <TabsContent value="health">
          <HealthTab />
        </TabsContent>
        <TabsContent value="system">
          <SystemTab />
        </TabsContent>
      </div>
    </Tabs>
  )
}
