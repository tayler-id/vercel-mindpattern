'use client'

import { useEffect, useId, useMemo, useRef, useState } from 'react'
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
  source_count?: number
  entity_count?: number
}

function hitToStory(hit: ArchiveHit): WireStory {
  return {
    ...hit,
    kind: 'story',
    source_count: hit.source_count ?? 0,
    entity_count: hit.entity_count ?? 0,
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
  const [archiveOffset, setArchiveOffset] = useState(0)
  const [archiveTotal, setArchiveTotal] = useState(0)
  const [corpusTotal, setCorpusTotal] = useState(0)
  const [searching, setSearching] = useState(false)
  const [extra, setExtra] = useState<WireStory[]>([])
  const [loadingMore, setLoadingMore] = useState(false)
  const [exhausted, setExhausted] = useState(false)
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null)
  const searchId = useId()

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
    const run = async () => {
      try {
        const params = new URLSearchParams({
          q: query,
          types: 'stories',
          limit: '100',
          offset: String(archiveOffset),
          user: 'ramsay',
        })
        if (section) params.set('section', section)
        if (takeOnly) params.set('take', '1')
        const response = await fetch(`/api/proxy/search/site?${params}`)
        const payload = await response.json()
        const hits = (payload.groups?.stories ?? []).map(hitToStory)
        setArchiveHits((prev) => (archiveOffset > 0 && prev ? [...prev, ...hits] : hits))
        setArchiveTotal(payload.totals?.stories ?? 0)
        setCorpusTotal(payload.totals?.stories_corpus ?? 0)
      } catch {
        setArchiveHits([])
        setArchiveTotal(0)
      } finally {
        setSearching(false)
      }
    }
    // A toggle click searches instantly; typing debounces.
    if (query.trim()) {
      debounce.current = setTimeout(run, 250)
    } else {
      void run()
    }
    return () => {
      if (debounce.current) clearTimeout(debounce.current)
    }
  }, [query, section, takeOnly, archiveOffset])

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
  const localPreview = useMemo(() => {
    const terms = query.toLowerCase().split(/\s+/).filter(Boolean)
    return baseStories.filter((story) => {
      if (section && story.section_id !== section) return false
      if (takeOnly && !story.take) return false
      if (terms.length) {
        const haystack = `${story.title} ${story.summary ?? ''}`.toLowerCase()
        if (!terms.every((t) => haystack.includes(t))) return false
      }
      return true
    })
  }, [baseStories, query, section, takeOnly])

  const filtered = useMemo(() => {
    if (!searchMode) return localPreview
    // Archive answer when we have it; instant local preview while it loads.
    return archiveHits ?? localPreview
  }, [searchMode, archiveHits, localPreview])

  return (
    <div>
      <div className="flex flex-wrap items-end gap-3 px-4 pt-4 max-sm:px-3">
        <div className="flex w-full flex-col gap-2 sm:w-64">
          <label htmlFor={searchId} className="type-kicker text-ink-faint">
            Search the wire
          </label>
          <input
            id={searchId}
            value={query}
            onChange={(e) => {
              setArchiveOffset(0)
              setQuery(e.target.value)
            }}
            placeholder="Search all stories…"
            className="w-full rounded-[3px] border-[1.5px] border-ink bg-paper px-4 py-2.5 text-[16px] text-ink outline-none transition-colors duration-(--dur-fast) placeholder:font-mono placeholder:text-ink-faint focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-ink sm:text-[14px]"
          />
        </div>
        <select
          value={section}
          onChange={(e) => {
            setArchiveOffset(0)
            setSection(e.target.value)
          }}
          aria-label="Filter by section"
          className="rounded-full border-[1.5px] border-ink bg-paper px-4 py-2 font-mono text-[16px] font-semibold uppercase tracking-[0.1em] text-ink outline-none transition-colors duration-(--dur-fast) hover:bg-spine focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink sm:text-[10.5px]"
        >
          <option value="">All sections</option>
          {sections.map(([id, label]) => (
            <option key={id} value={id}>{label}</option>
          ))}
        </select>
        <button
          onClick={() => {
            setArchiveOffset(0)
            setTakeOnly(!takeOnly)
          }}
          aria-pressed={takeOnly}
          className={`rounded-full px-4 py-2 font-mono text-[10.5px] uppercase tracking-[0.1em] transition-colors duration-(--dur-fast) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink active:scale-95 ${
            takeOnly
              ? 'bg-ink font-semibold text-white'
              : 'bg-panel font-medium text-ink hover:bg-spine'
          }`}
        >
          With take
        </button>
        {searchMode && (
          <span className="py-2 font-mono text-[0.6875rem] text-ink-faint">
            {searching
              ? `${filtered.length} on screen · searching all stories…`
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
      {searchMode && archiveHits && archiveHits.length < archiveTotal && (
        <div className="px-4 py-5 text-center">
          <button
            onClick={() => setArchiveOffset(archiveHits.length)}
            disabled={searching}
            className="type-kicker rounded-full border-[1.5px] border-ink px-6 py-3 text-ink transition-colors duration-(--dur-fast) hover:bg-ink hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink active:scale-95 disabled:border-panel disabled:bg-panel disabled:text-ink-faint"
          >
            {searching ? 'Loading…' : `Show more (${archiveHits.length.toLocaleString()} of ${archiveTotal.toLocaleString()})`}
          </button>
        </div>
      )}
      {!searchMode && canLoadMore && !exhausted && (
        <div className="px-4 py-5 text-center">
          <button
            onClick={loadMore}
            disabled={loadingMore}
            className="type-kicker rounded-full border-[1.5px] border-ink px-6 py-3 text-ink transition-colors duration-(--dur-fast) hover:bg-ink hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink active:scale-95 disabled:border-panel disabled:bg-panel disabled:text-ink-faint"
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
