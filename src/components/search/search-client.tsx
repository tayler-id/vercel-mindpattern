'use client'

import Link from 'next/link'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { trackEvent } from '@/lib/analytics'

type Groups = {
  stories?: { slug: string; title: string; summary: string; issue_date: string; target_url: string; has_take: boolean }[]
  findings?: { id: number; title: string; summary: string; run_date: string; target_url: string }[]
  entities?: { slug: string; name: string; mention_count: number; target_url: string }[]
  sources?: { domain: string; name: string; hit_count: number; target_url: string }[]
}

const TYPE_CHIPS = ['stories', 'findings', 'entities', 'sources'] as const

const GROUP_META: Record<string, { label: string; kicker: (item: never) => string }> = {}

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
    <div className="mt-6">
      <input
        ref={inputRef}
        value={q}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search the public graph…"
        aria-label="Search"
        className="w-full rounded-sm border border-line bg-surface px-4 py-3 font-mono text-[0.9375rem] text-ink outline-none placeholder:text-ink-faint focus:border-ink focus:shadow-[0_0_0_3px_var(--accent-wash)]"
      />
      <div className="mt-3 flex flex-wrap gap-2">
        {TYPE_CHIPS.map((type) => (
          <button
            key={type}
            onClick={() => toggleType(type)}
            aria-pressed={types.includes(type)}
            className={`rounded-sm border px-3 py-1 font-mono text-[0.6875rem] uppercase tracking-[0.08em] transition-colors ${
              types.includes(type)
                ? 'border-ink bg-panel text-ink'
                : 'border-line bg-surface text-ink-faint hover:bg-panel hover:text-ink'
            }`}
          >
            {type}
          </button>
        ))}
      </div>

      {busy && <p className="mt-6 font-mono text-[0.75rem] text-ink-faint">Searching…</p>}
      {!busy && q.trim() && total === 0 && (
        <p className="mt-6 font-mono text-[0.75rem] text-ink-faint">Nothing matched. Try fewer words.</p>
      )}

      {(groups.stories?.length ?? 0) > 0 && (
        <section className="mt-8">
          <h2 className="type-kicker text-primary">Stories</h2>
          <ol className="mt-2 divide-y divide-line">
            {groups.stories!.map((s) => (
              <li key={s.slug}>
                <Link href={s.target_url} className="block py-3 transition-colors hover:bg-spine">
                  <div className="type-kicker text-ink-faint">{s.issue_date}{s.has_take ? ' · with take' : ''}</div>
                  <div className="type-display mt-1 text-[1.0625rem] font-[560] leading-snug text-ink">{s.title}</div>
                  <p className="mt-0.5 line-clamp-2 font-serif text-[0.875rem] text-ink-prose">{s.summary}</p>
                </Link>
              </li>
            ))}
          </ol>
        </section>
      )}

      {(groups.findings?.length ?? 0) > 0 && (
        <section className="mt-8">
          <h2 className="type-kicker text-primary">Findings</h2>
          <ol className="mt-2 divide-y divide-line">
            {groups.findings!.map((f) => (
              <li key={f.id}>
                <Link href={f.target_url} className="block py-3 transition-colors hover:bg-spine">
                  <div className="type-kicker text-ink-faint">{f.run_date}</div>
                  <div className="type-display mt-1 text-[1.0625rem] font-[560] leading-snug text-ink">{f.title}</div>
                </Link>
              </li>
            ))}
          </ol>
        </section>
      )}

      {(groups.entities?.length ?? 0) > 0 && (
        <section className="mt-8">
          <h2 className="type-kicker text-primary">Entities</h2>
          <div className="mt-2 flex flex-wrap gap-2">
            {groups.entities!.map((e) => (
              <Link key={e.slug} href={e.target_url}
                className="rounded-sm border border-line bg-surface px-2.5 py-1.5 font-mono text-[0.6875rem] uppercase tracking-[0.08em] text-ink transition-colors hover:bg-panel hover:text-primary">
                {e.name}
              </Link>
            ))}
          </div>
        </section>
      )}

      {(groups.sources?.length ?? 0) > 0 && (
        <section className="mt-8">
          <h2 className="type-kicker text-primary">Sources</h2>
          <div className="mt-2 flex flex-wrap gap-2">
            {groups.sources!.map((s) => (
              <Link key={s.domain} href={s.target_url}
                className="rounded-sm border border-line bg-surface px-2.5 py-1.5 font-mono text-[0.6875rem] uppercase tracking-[0.08em] text-ink transition-colors hover:bg-panel hover:text-primary">
                {s.domain} · {s.hit_count}
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
