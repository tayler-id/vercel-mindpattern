'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import type { PublicStory } from '@/lib/types'
import { StoryWireRow } from './story-wire-row'
import { sectionLabel } from '@/lib/sections'

type WireStory = PublicStory & { trend?: string; views?: number }

interface ArchiveHit {
  slug: string
  title: string
  summary: string
  issue_date: string
  target_url: string
  has_take: boolean
  section_id: string
}

function hitToStory(hit: ArchiveHit): WireStory {
  return {
    ...hit,
    kind: 'story',
    id: hit.slug,
    take: hit.has_take ? 'yes' : '',
    body_excerpt: '',
    source_refs: [],
    entity_refs: [],
    finding_ids: [],
    arc_ids: [],
    related_paths: [],
    confidence: 'source-backed',
    labels: [],
    json_ld_ready: false,
    claim_evidence: [],
    provenance: {
      generated_by: '',
      generated_at: null,
      input_artifacts: [],
      source_issue_dates: [],
      redaction_status: 'passed',
      ai_generated: true,
      human_approved: false,
    },
  } as WireStory
}

/**
 * The wire list. Without a query: the ranked list passed in, with section /
 * take filters and (on Latest) load-more over the full archive. With a query:
 * server-side search across every published story, not just the loaded rows.
 */
export function WireList({
  stories,
  canLoadMore = false,
}: {
  stories: WireStory[]
  canLoadMore?: boolean
}) {
  const [query, setQuery] = useState('')
  const [section, setSection] = useState('')
  const [takeOnly, setTakeOnly] = useState(false)
  const [archiveHits, setArchiveHits] = useState<WireStory[] | null>(null)
  const [archiveTotal, setArchiveTotal] = useState(0)
  const [corpusTotal, setCorpusTotal] = useState(0)
  const [searching, setSearching] = useState(false)
  const [extra, setExtra] = useState<WireStory[]>([])
  const [loadingMore, setLoadingMore] = useState(false)
  const [exhausted, setExhausted] = useState(false)
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null)

  const baseStories = useMemo(() => {
    const seen = new Set(stories.map((s) => s.slug))
    return [...stories, ...extra.filter((s) => !seen.has(s.slug))]
  }, [stories, extra])

  const sections = useMemo(() => {
    const seen = new Map<string, string>()
    for (const story of baseStories) {
      const id = story.section_id || ''
      if (id && !seen.has(id)) seen.set(id, sectionLabel(id) || id)
    }
    return [...seen.entries()].sort((a, b) => a[1].localeCompare(b[1]))
  }, [baseStories])

  // Server-side archive search whenever a query or the take filter is active.
  useEffect(() => {
    if (!query.trim() && !takeOnly) {
      setArchiveHits(null)
      return
    }
    if (debounce.current) clearTimeout(debounce.current)
    setSearching(true)
    debounce.current = setTimeout(async () => {
      try {
        const params = new URLSearchParams({
          q: query,
          types: 'stories',
          limit: '100',
          user: 'ramsay',
        })
        if (section) params.set('section', section)
        if (takeOnly) params.set('take', '1')
        const response = await fetch(`/api/proxy/search/site?${params}`)
        const payload = await response.json()
        setArchiveHits((payload.groups?.stories ?? []).map(hitToStory))
        setArchiveTotal(payload.totals?.stories ?? 0)
        setCorpusTotal(payload.totals?.stories_corpus ?? 0)
      } catch {
        setArchiveHits([])
        setArchiveTotal(0)
      } finally {
        setSearching(false)
      }
    }, 250)
    return () => {
      if (debounce.current) clearTimeout(debounce.current)
    }
  }, [query, section, takeOnly])

  const loadMore = async () => {
    if (loadingMore || exhausted) return
    setLoadingMore(true)
    try {
      const offset = baseStories.length
      const response = await fetch(
        `/api/proxy/stories?user=ramsay&limit=50&offset=${offset}`,
      )
      const payload = await response.json()
      const items: WireStory[] = payload.items ?? []
      if (items.length === 0 || !payload.has_more) setExhausted(true)
      setExtra((prev) => [...prev, ...items])
      if (payload.total) setCorpusTotal(payload.total)
    } catch {
      // leave the button available to retry
    } finally {
      setLoadingMore(false)
    }
  }

  const searchMode = query.trim().length > 0 || takeOnly
  const source = searchMode ? (archiveHits ?? []) : baseStories
  const filtered = useMemo(() => {
    if (searchMode) return source
    return source.filter((story) => {
      if (section && story.section_id !== section) return false
      return true
    })
  }, [source, section, searchMode])

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2 px-3 pt-3 sm:px-4">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search all stories…"
          aria-label="Search all stories"
          className="w-52 rounded-full border border-line bg-surface px-3.5 py-1.5 font-mono text-[0.75rem] text-ink outline-none focus:border-primary"
        />
        <select
          value={section}
          onChange={(e) => setSection(e.target.value)}
          aria-label="Filter by section"
          className="rounded-full border border-line bg-surface px-3 py-1.5 font-mono text-[0.75rem] text-ink outline-none focus:border-primary"
        >
          <option value="">All sections</option>
          {sections.map(([id, label]) => (
            <option key={id} value={id}>{label}</option>
          ))}
        </select>
        <button
          onClick={() => setTakeOnly(!takeOnly)}
          aria-pressed={takeOnly}
          className={`rounded-full border px-3 py-1.5 font-mono text-[0.6875rem] uppercase tracking-wide ${
            takeOnly ? 'border-primary bg-primary/[0.06] text-primary' : 'border-line text-ink-faint hover:text-ink'
          }`}
        >
          With take
        </button>
        {searchMode && (
          <span className="font-mono text-[0.6875rem] text-ink-faint">
            {searching
              ? 'searching the archive…'
              : `${archiveTotal.toLocaleString()}${takeOnly ? ' with takes' : ' matches'} in ${corpusTotal.toLocaleString()} stories${archiveTotal > filtered.length ? ` · top ${filtered.length}` : ''}`}
          </span>
        )}
      </div>
      <ol>
        {filtered.map((story, i) => (
          <li key={story.slug}>
            <StoryWireRow story={story} rank={i + 1} />
          </li>
        ))}
      </ol>
      {filtered.length === 0 && !searching && (
        <p className="px-4 py-10 text-center font-mono text-[0.8125rem] text-ink-faint">
          {searchMode ? 'No stories match that search.' : 'Nothing matches those filters.'}
        </p>
      )}
      {!searchMode && canLoadMore && !exhausted && (
        <div className="px-4 py-5 text-center">
          <button
            onClick={loadMore}
            disabled={loadingMore}
            className="rounded-full border border-line px-5 py-2 font-mono text-[0.71875rem] uppercase tracking-wide text-ink transition-colors hover:border-primary hover:text-primary disabled:opacity-60"
          >
            {loadingMore
              ? 'Loading…'
              : `Load more (${baseStories.length.toLocaleString()}${corpusTotal ? ` of ${corpusTotal.toLocaleString()}` : ''})`}
          </button>
        </div>
      )}
    </div>
  )
}
