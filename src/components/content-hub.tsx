'use client'

import { useState } from 'react'
import { Search, ArrowUpRight, TrendingUp, ChevronDown } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import Link from 'next/link'
import type { Finding, Pattern, ReportListItem } from '@/lib/types'

type ContentType = 'all' | 'briefing' | 'finding' | 'pattern'

interface ContentItem {
  type: 'briefing' | 'finding' | 'pattern'
  title: string
  summary: string
  date: string
  importance?: string
  agent?: string
  recurrence?: number
  href?: string
  sourceUrl?: string
  tags?: string[]
  size?: number
}

const TABS: { id: ContentType; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'briefing', label: 'Briefings' },
  { id: 'finding', label: 'Findings' },
  { id: 'pattern', label: 'Patterns' },
]

function normalizeContent(
  reports: ReportListItem[],
  findings: Finding[],
  patterns: Pattern[],
): ContentItem[] {
  const items: ContentItem[] = []

  for (const r of reports) {
    items.push({
      type: 'briefing',
      title: r.title,
      summary: 'Compiled from 13 autonomous agents scanning news, papers, repos, and discussions.',
      date: r.date,
      href: `/blog/${r.date}`,
      size: r.size,
    })
  }

  for (const f of findings) {
    items.push({
      type: 'finding',
      title: f.title,
      summary: f.summary,
      date: f.run_date,
      importance: f.importance,
      agent: f.agent,
      sourceUrl: f.source_url || undefined,
      tags: [f.agent],
    })
  }

  for (const p of patterns) {
    items.push({
      type: 'pattern',
      title: p.theme,
      summary: p.description,
      date: p.last_seen,
      recurrence: p.recurrence_count,
    })
  }

  items.sort((a, b) => b.date.localeCompare(a.date))
  return items
}

function extractTags(findings: Finding[]): { tag: string; count: number }[] {
  const counts: Record<string, number> = {}
  for (const f of findings) {
    counts[f.agent] = (counts[f.agent] || 0) + 1
  }
  return Object.entries(counts)
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count)
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function groupByDate(items: ContentItem[]): Map<string, ContentItem[]> {
  const groups = new Map<string, ContentItem[]>()
  for (const item of items) {
    const existing = groups.get(item.date)
    if (existing) {
      existing.push(item)
    } else {
      groups.set(item.date, [item])
    }
  }
  return groups
}

export function ContentHub({
  reports,
  findings,
  patterns,
  totalFindings = 0,
}: {
  reports: ReportListItem[]
  findings: Finding[]
  patterns: Pattern[]
  totalFindings?: number
}) {
  const [tab, setTab] = useState<ContentType>('all')
  const [search, setSearch] = useState('')
  const [selectedTag, setSelectedTag] = useState<string | null>(null)
  const [visibleCount, setVisibleCount] = useState(40)

  const allItems = normalizeContent(reports, findings, patterns)
  const tags = extractTags(findings)

  const filtered = allItems.filter((item) => {
    if (tab !== 'all' && item.type !== tab) return false
    if (selectedTag && !item.tags?.includes(selectedTag)) return false
    if (search) {
      const q = search.toLowerCase()
      return (
        item.title.toLowerCase().includes(q) ||
        item.summary.toLowerCase().includes(q)
      )
    }
    return true
  })

  const visible = filtered.slice(0, visibleCount)
  const hasMore = filtered.length > visibleCount
  const grouped = groupByDate(visible)

  const totalCounts = {
    all: allItems.length,
    briefing: reports.length,
    finding: totalFindings || findings.length,
    pattern: patterns.length,
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6">
      {/* ── Hero ────────────────────────────────────── */}
      <div className="pt-12 pb-10">
        <h1
          className="text-[clamp(1.5rem,1.2rem+1vw,2.25rem)] font-bold tracking-tight leading-[1.15] mb-3"
        >
          AI Research
          <br />
          Intelligence
        </h1>
        <p className="text-muted-foreground leading-relaxed max-w-md">
          {reports.length} briefings, {totalFindings || findings.length} findings, and {patterns.length} recurring
          patterns — surfaced by 13 autonomous agents.
        </p>
      </div>

      {/* ── Search ──────────────────────────────────── */}
      <div className="relative mb-8">
        <Search className="absolute left-0 top-1/2 -translate-y-1/2 size-[18px] text-muted-foreground/30" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search..."
          className="w-full bg-transparent border-b border-border pl-7 pr-4 py-3 text-[15px] placeholder:text-muted-foreground/30 focus:outline-none focus:border-foreground transition-colors"
        />
      </div>

      {/* ── Tags ────────────────────────────────────── */}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-x-3 gap-y-2 mb-10 text-[13px]">
          {tags.slice(0, 10).map(({ tag, count }) => (
            <button
              key={tag}
              onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
              className={`transition-colors ${
                selectedTag === tag
                  ? 'text-primary font-medium'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {tag}
              <span className="text-[11px] ml-0.5 opacity-40">{count}</span>
            </button>
          ))}
          {selectedTag && (
            <button
              onClick={() => setSelectedTag(null)}
              className="text-primary/60 hover:text-primary"
            >
              clear
            </button>
          )}
        </div>
      )}

      {/* ── Tabs ────────────────────────────────────── */}
      <div className="flex gap-6 mb-10">
        {TABS.map(({ id, label }) => (
          <button
            key={id}
            onClick={() => { setTab(id); setVisibleCount(40) }}
            className={`text-[13px] font-mono uppercase tracking-wider pb-2 transition-colors relative ${
              tab === id
                ? 'text-foreground font-semibold'
                : 'text-muted-foreground/50 hover:text-muted-foreground'
            }`}
          >
            {label}
            {tab === id && (
              <motion.div
                layoutId="active-tab"
                className="absolute bottom-0 left-0 right-0 h-px bg-foreground"
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              />
            )}
          </button>
        ))}
        <span className="ml-auto text-[12px] text-muted-foreground/40 font-mono self-end pb-2">
          {filtered.length} / {totalCounts[tab]}
        </span>
      </div>

      {/* ── Content stream, grouped by date ─────────── */}
      <AnimatePresence mode="popLayout">
        {filtered.length === 0 ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="py-24 text-center"
          >
            <p className="text-muted-foreground/60">Nothing matches.</p>
          </motion.div>
        ) : (
          <div className="pb-20">
            {Array.from(grouped.entries()).map(([date, items], gi) => (
              <div key={date} className="mb-2">
                {/* Date heading */}
                <div className="sticky top-0 z-10 bg-background/90 backdrop-blur-sm py-2 mb-1">
                  <span className="text-[11px] font-mono text-muted-foreground/40 uppercase tracking-widest">
                    {formatDate(date)}
                  </span>
                </div>

                {/* Items for this date */}
                {items.map((item, i) => (
                  <motion.div
                    key={`${item.type}-${item.title}-${gi}-${i}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: Math.min((gi * items.length + i) * 0.01, 0.2) }}
                  >
                    {item.type === 'briefing' ? (
                      <BriefingEntry item={item} />
                    ) : item.type === 'finding' ? (
                      <FindingEntry item={item} />
                    ) : (
                      <PatternEntry item={item} />
                    )}
                  </motion.div>
                ))}
              </div>
            ))}

            {hasMore && (
              <div className="pt-8 flex justify-center">
                <button
                  onClick={() => setVisibleCount((c) => c + 40)}
                  className="group flex items-center gap-2 text-[13px] text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ChevronDown className="size-4 group-hover:translate-y-0.5 transition-transform" />
                  {filtered.length - visibleCount} more
                </button>
              </div>
            )}
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}

/* ── Briefing — the most prominent content type ────── */
function BriefingEntry({ item }: { item: ContentItem }) {
  return (
    <Link href={item.href || '#'} className="group block py-5">
      <div className="flex items-baseline gap-3 mb-2">
        <span className="text-[10px] font-mono font-bold uppercase tracking-[0.15em] text-primary">
          Briefing
        </span>
      </div>
      <h3 className="text-[clamp(1.0625rem,1rem+0.2vw,1.1875rem)] font-semibold leading-snug mb-2 group-hover:text-primary transition-colors tracking-tight">
        {item.title}
        <ArrowUpRight className="inline-block size-4 ml-1.5 opacity-0 group-hover:opacity-60 -translate-y-0.5 transition-all" />
      </h3>
      <p className="text-[14px] text-muted-foreground leading-relaxed">
        {item.summary}
      </p>
    </Link>
  )
}

/* ── Finding — medium weight ───────────────────────── */
function FindingEntry({ item }: { item: ContentItem }) {
  const isHigh = item.importance === 'high'

  const content = (
    <div className="group py-3.5 flex gap-4">
      <div className="flex-1 min-w-0">
        <h3 className={`text-[14px] leading-snug mb-1 group-hover:text-primary transition-colors ${isHigh ? 'font-semibold' : 'font-medium'}`}>
          {item.title}
          {item.sourceUrl && (
            <ArrowUpRight className="inline-block size-3 ml-1 opacity-0 group-hover:opacity-50 transition-opacity" />
          )}
        </h3>
        <p className="text-[13px] text-muted-foreground/70 leading-relaxed line-clamp-2">
          {item.summary}
        </p>
      </div>
      <div className="shrink-0 flex flex-col items-end gap-1 pt-0.5">
        {isHigh && (
          <span className="size-1.5 rounded-full bg-primary" />
        )}
        <span className="text-[10px] font-mono text-muted-foreground/30">
          {item.agent}
        </span>
      </div>
    </div>
  )

  if (item.sourceUrl) {
    return (
      <a href={item.sourceUrl} target="_blank" rel="noopener noreferrer">
        {content}
      </a>
    )
  }

  return content
}

/* ── Pattern — subtle, recurring ───────────────────── */
function PatternEntry({ item }: { item: ContentItem }) {
  return (
    <div className="py-3 flex items-start gap-3 text-muted-foreground/60">
      <TrendingUp className="size-3.5 mt-1 shrink-0" />
      <div className="min-w-0">
        <span className="text-[13px] text-foreground/80 font-medium">
          {item.title}
        </span>
        {item.recurrence && item.recurrence > 2 && (
          <span className="text-[11px] font-mono ml-2 text-muted-foreground/30">
            {item.recurrence}x
          </span>
        )}
        <p className="text-[12px] leading-relaxed line-clamp-1 mt-0.5">
          {item.summary}
        </p>
      </div>
    </div>
  )
}
