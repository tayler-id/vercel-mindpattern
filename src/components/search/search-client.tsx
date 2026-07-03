'use client'

import Link from 'next/link'
import type { CSSProperties } from 'react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { trackEvent } from '@/lib/analytics'
import { topicVars } from '@/lib/topic-color'

type Groups = {
  stories?: { slug: string; title: string; summary: string; issue_date: string; target_url: string; has_take: boolean }[]
  findings?: { id: number; title: string; summary: string; run_date: string; target_url: string }[]
  entities?: { slug: string; name: string; mention_count: number; target_url: string }[]
  sources?: { domain: string; name: string; hit_count: number; target_url: string }[]
}

const TYPE_CHIPS = ['stories', 'findings', 'entities', 'sources'] as const

const FOCUS_RING = 'focus-visible:outline-2 focus-visible:outline-ink focus-visible:outline-offset-2'

export function SearchClient() {
  const router = useRouter()
  const params = useSearchParams()
  const [q, setQ] = useState(params.get('q') ?? '')
  const [types, setTypes] = useState<string[]>(
    (params.get('types') ?? 'stories,findings,entities,sources').split(','),
  )
  const [groups, setGroups] = useState<Groups>({})
  const [busy, setBusy] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null)

  const run = useCallback(async (query: string, activeTypes: string[]) => {
    if (!query.trim()) {
      setGroups({})
      return
    }
    setBusy(true)
    try {
      const url = `/api/proxy/search/site?q=${encodeURIComponent(query)}&types=${activeTypes.join(',')}&user=ramsay&limit=8`
      const response = await fetch(url)
      const payload = await response.json()
      setGroups(payload.groups ?? {})
      trackEvent('search_query', { id: query.slice(0, 60) })
    } catch {
      setGroups({})
    } finally {
      setBusy(false)
    }
  }, [])

  useEffect(() => {
    inputRef.current?.focus()
    const initial = params.get('q')
    if (initial) run(initial, types)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const onChange = (value: string) => {
    setQ(value)
    if (debounce.current) clearTimeout(debounce.current)
    debounce.current = setTimeout(() => {
      router.replace(`/search?q=${encodeURIComponent(value)}&types=${types.join(',')}`, { scroll: false })
      run(value, types)
    }, 250)
  }

  const toggleType = (type: string) => {
    const next = types.includes(type) ? types.filter((t) => t !== type) : [...types, type]
    if (next.length === 0) return
    setTypes(next)
    run(q, next)
  }

  const total =
    (groups.stories?.length ?? 0) + (groups.findings?.length ?? 0) +
    (groups.entities?.length ?? 0) + (groups.sources?.length ?? 0)

  return (
    <div className="mt-8">
      <label htmlFor="site-search" className="type-kicker block text-ink-soft">
        Query
      </label>
      <input
        id="site-search"
        ref={inputRef}
        value={q}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search the public graph…"
        className="mt-2 w-full rounded-[3px] border-[1.5px] border-ink bg-paper px-4 py-2.5 font-sans text-[16px] text-ink outline-none placeholder:font-mono placeholder:text-[13px] placeholder:text-ink-faint focus-visible:outline-2 focus-visible:outline-ink sm:text-[14px]"
      />
      <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="Result types">
        {TYPE_CHIPS.map((type) => {
          const active = types.includes(type)
          return (
            <button
              key={type}
              onClick={() => toggleType(type)}
              aria-pressed={active}
              className={`min-h-[44px] rounded-full px-4 py-2 font-mono text-[0.65625rem] uppercase tracking-[0.1em] transition-all duration-[var(--dur-fast)] ease-[var(--ease-swift)] active:scale-95 ${FOCUS_RING} ${
                active
                  ? 'bg-ink font-semibold text-white'
                  : 'bg-panel font-medium text-ink hover:bg-spine'
              }`}
            >
              {type}
            </button>
          )
        })}
      </div>

      {busy && (
        <p className="type-kicker mt-6 text-ink-faint" role="status">
          Searching…
        </p>
      )}
      {!busy && q.trim() && total === 0 && (
        <p className="type-kicker mt-6 text-ink-faint">Nothing matched. Try fewer words.</p>
      )}
      {!busy && q.trim() && total > 0 && (
        <p className="type-kicker mt-6 text-ink-faint" role="status">
          {total} result{total === 1 ? '' : 's'}
        </p>
      )}

      {(groups.stories?.length ?? 0) > 0 && (
        <section className="mt-8">
          <h2 className="type-display text-[25px] uppercase leading-[1.04] text-ink">Stories</h2>
          <ol className="mt-2">
            {groups.stories!.map((s, i) => (
              <li
                key={s.slug}
                className="rise-in flood-row rule-row group"
                style={{ ...topicVars(s.slug), '--i': i } as CSSProperties}
              >
                <Link href={s.target_url} className="grid grid-cols-[1fr_auto] gap-4 px-4 py-4">
                  <span className="block min-w-0">
                    <span className="type-kicker block text-[color:var(--tc-text)]">
                      {s.issue_date}
                      {s.has_take ? ' · with take' : ''}
                    </span>
                    <span className="type-display mt-2 block text-[1.1875rem] leading-[1.1] text-ink">{s.title}</span>
                    <span className="mt-2 line-clamp-2 block font-serif text-[0.875rem] leading-[1.5] text-ink-soft">{s.summary}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ol>
        </section>
      )}

      {(groups.findings?.length ?? 0) > 0 && (
        <section className="mt-8">
          <h2 className="type-display text-[25px] uppercase leading-[1.04] text-ink">Findings</h2>
          <ol className="mt-2">
            {groups.findings!.map((f, i) => (
              <li
                key={f.id}
                className="rise-in flood-row rule-row group"
                style={{ ...topicVars(String(f.id)), '--i': i } as CSSProperties}
              >
                <Link href={f.target_url} className="grid grid-cols-[1fr_auto] gap-4 px-4 py-4">
                  <span className="block min-w-0">
                    <span className="type-kicker block text-[color:var(--tc-text)]">{f.run_date}</span>
                    <span className="type-display mt-2 block text-[1.1875rem] leading-[1.1] text-ink">{f.title}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ol>
        </section>
      )}

      {(groups.entities?.length ?? 0) > 0 && (
        <section className="mt-8">
          <h2 className="type-display text-[25px] uppercase leading-[1.04] text-ink">Entities</h2>
          <div className="mt-3 flex flex-wrap gap-3">
            {groups.entities!.map((e, i) => (
              <Link
                key={e.slug}
                href={e.target_url}
                className={`tag-chip rise-in inline-block transition-transform duration-[var(--dur-fast)] ease-[var(--ease-swift)] hover:-translate-y-0.5 ${FOCUS_RING}`}
                style={{ ...topicVars(e.slug), '--i': i } as CSSProperties}
              >
                {e.name}
              </Link>
            ))}
          </div>
        </section>
      )}

      {(groups.sources?.length ?? 0) > 0 && (
        <section className="mt-8">
          <h2 className="type-display text-[25px] uppercase leading-[1.04] text-ink">Sources</h2>
          <div className="mt-3 flex flex-wrap gap-3">
            {groups.sources!.map((s, i) => (
              <Link
                key={s.domain}
                href={s.target_url}
                className={`rise-in inline-block rounded-full bg-panel px-4 py-2 font-mono text-[0.65625rem] font-semibold uppercase tracking-[0.1em] text-ink transition-all duration-[var(--dur-fast)] ease-[var(--ease-swift)] hover:-translate-y-0.5 hover:bg-ink hover:text-white ${FOCUS_RING}`}
                style={{ '--i': i } as CSSProperties}
              >
                {s.domain} · {s.hit_count}
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
