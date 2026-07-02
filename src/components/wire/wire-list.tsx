'use client'

import { useMemo, useState } from 'react'
import type { PublicStory } from '@/lib/types'
import { StoryWireRow } from './story-wire-row'
import { sectionLabel } from '@/lib/sections'

type WireStory = PublicStory & { trend?: string; views?: number }

/** Client-side list with in-place filtering: text, section, with-take. */
export function WireList({ stories }: { stories: WireStory[] }) {
  const [query, setQuery] = useState('')
  const [section, setSection] = useState('')
  const [takeOnly, setTakeOnly] = useState(false)

  const sections = useMemo(() => {
    const seen = new Map<string, string>()
    for (const story of stories) {
      const id = story.section_id || ''
      if (id && !seen.has(id)) seen.set(id, sectionLabel(id) || id)
    }
    return [...seen.entries()].sort((a, b) => a[1].localeCompare(b[1]))
  }, [stories])

  const filtered = useMemo(() => {
    const terms = query.toLowerCase().split(/\s+/).filter(Boolean)
    return stories.filter((story) => {
      if (section && story.section_id !== section) return false
      if (takeOnly && !story.take) return false
      if (terms.length) {
        const haystack = `${story.title} ${story.summary ?? ''}`.toLowerCase()
        if (!terms.every((t) => haystack.includes(t))) return false
      }
      return true
    })
  }, [stories, query, section, takeOnly])

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2 px-3 pt-3 sm:px-4">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Filter this list…"
          aria-label="Filter stories"
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
        {(query || section || takeOnly) && (
          <span className="font-mono text-[0.6875rem] text-ink-faint">
            {filtered.length} of {stories.length}
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
      {filtered.length === 0 && (
        <p className="px-4 py-10 text-center font-mono text-[0.8125rem] text-ink-faint">
          Nothing matches those filters.
        </p>
      )}
    </div>
  )
}
