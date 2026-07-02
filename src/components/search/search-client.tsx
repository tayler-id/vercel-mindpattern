'use client'

import Link from 'next/link'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { trackEvent } from '@/lib/analytics'
import { Streamdown } from 'streamdown'

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
  const [answer, setAnswer] = useState('')
  const [asking, setAsking] = useState(false)
  const [askError, setAskError] = useState('')
  const [askedQ, setAskedQ] = useState('')
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

  const askSources = () => [
    ...(groups.stories ?? []).map((s) => ({
      title: s.title, summary: s.summary, date: s.issue_date, url: s.target_url,
    })),
    ...(groups.findings ?? []).map((f) => ({
      title: f.title, summary: f.summary, date: f.run_date, url: f.target_url,
    })),
  ].slice(0, 10)

  const ask = async () => {
    const sources = askSources()
    if (!q.trim() || sources.length === 0 || asking) return
    setAsking(true)
    setAnswer('')
    setAskError('')
    setAskedQ(q)
    trackEvent('search_query', { id: `ask:${q.slice(0, 50)}` })
    try {
      const response = await fetch('/api/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ q, sources }),
      })
      if (!response.ok) {
        const payload = await response.json().catch(() => null)
        setAskError(payload?.error ?? 'Ask failed. Try again.')
        return
      }
      const reader = response.body!.getReader()
      const decoder = new TextDecoder()
      let text = ''
      for (;;) {
        const { done, value } = await reader.read()
        if (done) break
        text += decoder.decode(value, { stream: true })
        setAnswer(text)
      }
    } catch {
      setAskError('Ask failed. Try again.')
    } finally {
      setAsking(false)
    }
  }

  const onChange = (value: string) => {
    setQ(value)
    if (debounce.current) clearTimeout(debounce.current)
    setAnswer('')
    setAskError('')
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
        className="w-full rounded-xl border border-line bg-surface px-4 py-3 font-mono text-[0.9375rem] text-ink outline-none focus:border-primary"
      />
      <div className="mt-3 flex flex-wrap gap-2">
        {TYPE_CHIPS.map((type) => (
          <button
            key={type}
            onClick={() => toggleType(type)}
            aria-pressed={types.includes(type)}
            className={`rounded-full border px-3 py-1 font-mono text-[0.6875rem] uppercase tracking-wide transition-colors ${
              types.includes(type)
                ? 'border-primary bg-primary/[0.06] text-primary'
                : 'border-line text-ink-faint hover:text-ink'
            }`}
          >
            {type}
          </button>
        ))}
      </div>

      {q.trim() && total > 0 && (
        <button
          onClick={ask}
          disabled={asking}
          className="mt-5 flex w-full items-center gap-2.5 rounded-xl border border-line bg-surface px-4 py-3 text-left transition-colors hover:border-primary disabled:opacity-60"
        >
          <span className="font-mono text-[0.875rem] text-primary" aria-hidden>✦</span>
          <span className="min-w-0 flex-1 truncate text-[0.875rem] font-semibold text-ink">
            {asking ? 'Consulting the corpus…' : `Ask MindPattern: "${q}"`}
          </span>
          <span className="font-mono text-[0.625rem] uppercase tracking-wide text-ink-faint">
            AI answer, cited
          </span>
        </button>
      )}

      {askError && (
        <p className="mt-3 font-mono text-[0.75rem] text-primary">{askError}</p>
      )}

      {answer && (
        <section className="mt-4 rounded-xl border border-line bg-surface p-5">
          <div className="font-mono text-[0.625rem] font-semibold uppercase tracking-wide text-primary">
            Analyst answer · {askedQ}
          </div>
          <div className="prose-sm mt-3 max-w-none text-[0.875rem] leading-relaxed text-ink [&_p]:mt-2">
            <Streamdown>{answer}</Streamdown>
          </div>
          <ol className="mt-4 space-y-1 border-t border-line pt-3">
            {askSources().map((s, i) => (
              <li key={`${s.url}-${i}`} className="font-mono text-[0.6875rem] text-ink-faint">
                [{i + 1}]{' '}
                <Link href={s.url ?? '#'} className="text-navy hover:underline">
                  {s.title}
                </Link>{' '}
                · {s.date}
              </li>
            ))}
          </ol>
          <p className="mt-3 font-mono text-[0.625rem] text-ink-faint">
            Grounded in the corpus excerpts above. Verify against the cited stories.
          </p>
        </section>
      )}

      {busy && <p className="mt-6 font-mono text-[0.75rem] text-ink-faint">Searching…</p>}
      {!busy && q.trim() && total === 0 && (
        <p className="mt-6 font-mono text-[0.75rem] text-ink-faint">Nothing matched. Try fewer words.</p>
      )}

      {(groups.stories?.length ?? 0) > 0 && (
        <section className="mt-8">
          <h2 className="font-mono text-[0.6875rem] font-semibold uppercase text-primary">Stories</h2>
          <ol className="mt-2 divide-y divide-line">
            {groups.stories!.map((s) => (
              <li key={s.slug}>
                <Link href={s.target_url} className="block py-3 hover:bg-accent-wash">
                  <div className="font-mono text-[0.625rem] text-ink-faint">{s.issue_date}{s.has_take ? ' · with take' : ''}</div>
                  <div className="text-[0.9375rem] font-semibold text-ink">{s.title}</div>
                  <p className="mt-0.5 line-clamp-2 font-serif text-[0.875rem] text-[#30343b]">{s.summary}</p>
                </Link>
              </li>
            ))}
          </ol>
        </section>
      )}

      {(groups.findings?.length ?? 0) > 0 && (
        <section className="mt-8">
          <h2 className="font-mono text-[0.6875rem] font-semibold uppercase text-primary">Findings</h2>
          <ol className="mt-2 divide-y divide-line">
            {groups.findings!.map((f) => (
              <li key={f.id}>
                <Link href={f.target_url} className="block py-3 hover:bg-accent-wash">
                  <div className="font-mono text-[0.625rem] text-ink-faint">{f.run_date}</div>
                  <div className="text-[0.9375rem] font-semibold text-ink">{f.title}</div>
                </Link>
              </li>
            ))}
          </ol>
        </section>
      )}

      {(groups.entities?.length ?? 0) > 0 && (
        <section className="mt-8">
          <h2 className="font-mono text-[0.6875rem] font-semibold uppercase text-primary">Entities</h2>
          <div className="mt-2 flex flex-wrap gap-2">
            {groups.entities!.map((e) => (
              <Link key={e.slug} href={e.target_url}
                className="rounded-lg border border-line px-2.5 py-1.5 font-mono text-[0.71875rem] text-primary hover:border-primary">
                {e.name}
              </Link>
            ))}
          </div>
        </section>
      )}

      {(groups.sources?.length ?? 0) > 0 && (
        <section className="mt-8">
          <h2 className="font-mono text-[0.6875rem] font-semibold uppercase text-primary">Sources</h2>
          <div className="mt-2 flex flex-wrap gap-2">
            {groups.sources!.map((s) => (
              <Link key={s.domain} href={s.target_url}
                className="rounded-lg border border-line px-2.5 py-1.5 font-mono text-[0.71875rem] text-primary hover:border-primary">
                {s.domain} · {s.hit_count}
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
