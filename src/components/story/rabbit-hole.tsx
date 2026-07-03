'use client'

import Link from 'next/link'
import type { CSSProperties } from 'react'
import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import type { Finding, RelatedResponse } from '@/lib/types'
import { sectionLabel, leaderFrom, sourceDomain, sourceLabel } from '@/lib/sections'
import { topicVars } from '@/lib/topic-color'
import { SourceFavicon } from '@/components/wire/source-favicon'
import { ViaAvatar } from '@/components/wire/via-avatar'
import { VideoEmbed } from '@/components/video/video-embed'
import { youtubeId } from '@/lib/video'

export function RabbitHole({
  initial,
  initialRelated,
}: {
  initial: Finding
  initialRelated: Finding[]
}) {
  const [trail, setTrail] = useState<Finding[]>([initial])
  const [relatedById, setRelatedById] = useState<Record<number, Finding[]>>({
    [initial.id]: initialRelated,
  })
  const [loadingRelated, setLoadingRelated] = useState<Record<number, boolean>>({})
  const [relatedError, setRelatedError] = useState<Record<number, boolean>>({})
  const [dir, setDir] = useState(1)
  const rootRef = useRef<HTMLDivElement>(null)
  const crumbsRef = useRef<HTMLDivElement>(null)
  const mountedRef = useRef(true)
  const relatedByIdRef = useRef(relatedById)
  const loadingRelatedRef = useRef(loadingRelated)
  const controllersRef = useRef<Set<AbortController>>(new Set())
  const reduce = useReducedMotion()
  const current = trail[trail.length - 1]

  useEffect(() => {
    relatedByIdRef.current = relatedById
  }, [relatedById])

  useEffect(() => {
    loadingRelatedRef.current = loadingRelated
  }, [loadingRelated])

  useEffect(() => {
    const controllers = controllersRef.current
    return () => {
      mountedRef.current = false
      controllers.forEach((controller) => controller.abort())
      controllers.clear()
    }
  }, [])

  useEffect(() => {
    const toTop = () => {
      rootRef.current?.scrollTo({ top: 0 })
      document.getElementById('main-content')?.scrollTo({ top: 0 })
      window.scrollTo({ top: 0 })
    }
    toTop()
    const raf = requestAnimationFrame(toTop)
    crumbsRef.current?.scrollTo({ left: crumbsRef.current.scrollWidth, behavior: 'smooth' })
    return () => cancelAnimationFrame(raf)
  }, [current.id])

  useEffect(() => {
    const findingId = current.id
    if (relatedByIdRef.current[findingId] || loadingRelatedRef.current[findingId]) return

    const controller = new AbortController()
    controllersRef.current.add(controller)
    const timeout = window.setTimeout(() => controller.abort(), 8000)

    setRelatedError((state) => ({ ...state, [findingId]: false }))
    setLoadingRelated((state) => ({ ...state, [findingId]: true }))

    async function loadRelated() {
      try {
        const res = await fetch(`/api/proxy/related/${findingId}?user=ramsay&mode=blended&limit=8`, {
          cache: 'no-store',
          signal: controller.signal,
        })
        if (!res.ok) throw new Error(`Related ${res.status}`)
        const body = (await res.json()) as RelatedResponse
        if (mountedRef.current) {
          const items = Array.isArray(body.items) ? body.items : []
          setRelatedById((state) => ({ ...state, [findingId]: items }))
        }
      } catch {
        if (mountedRef.current) {
          setRelatedError((state) => ({ ...state, [findingId]: true }))
          setRelatedById((state) => ({ ...state, [findingId]: [] }))
        }
      } finally {
        window.clearTimeout(timeout)
        controllersRef.current.delete(controller)
        if (mountedRef.current) {
          setLoadingRelated((state) => ({ ...state, [findingId]: false }))
        }
      }
    }

    void loadRelated()
  }, [current.id])

  const open = (f: Finding) => {
    if (f.id === current.id) return
    setDir(1)
    setTrail((t) => [...t, f])
  }
  const jumpTo = (i: number) => {
    setDir(-1)
    setTrail((t) => t.slice(0, i + 1))
  }

  const slide = reduce ? 0 : 28

  return (
    <div ref={rootRef} className="h-full overflow-y-auto">
      {/* Breadcrumb trail */}
      <div
        ref={crumbsRef}
        className="sticky top-0 z-10 flex items-center gap-1.5 overflow-x-auto border-b border-ink bg-paper/85 px-4 py-2.5 backdrop-blur-md [-ms-overflow-style:none] [scrollbar-width:none]"
      >
        <Link
          href="/"
          className="shrink-0 font-mono text-[0.6875rem] font-semibold uppercase tracking-[0.08em] text-primary"
        >
          The Wire
        </Link>
        {trail.map((f, i) => {
          const last = i === trail.length - 1
          return (
            <span key={`${f.id}-${i}`} className="flex shrink-0 items-center gap-1.5">
              <span className="text-ink-faint/60" aria-hidden>
                ›
              </span>
              <button
                onClick={() => jumpTo(i)}
                disabled={last}
                aria-current={last ? 'page' : undefined}
                className={`max-w-[150px] truncate font-mono text-[0.6875rem] ${
                  last ? 'font-semibold text-ink' : 'text-ink-faint hover:text-ink'
                }`}
              >
                {f.title}
              </button>
            </span>
          )
        })}
      </div>

      {/* Active story — slides in on drill */}
      <div className="overflow-hidden">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={current.id}
            initial={{ opacity: 0, x: dir * slide }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: dir * -slide * 0.6 }}
            transition={{ duration: reduce ? 0 : 0.24, ease: [0.32, 0.72, 0, 1] }}
          >
            <ReadingColumn
              finding={current}
              related={relatedById[current.id] ?? []}
              relatedLoading={!!loadingRelated[current.id]}
              relatedError={!!relatedError[current.id]}
              onOpen={open}
            />
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}

function ReadingColumn({
  finding,
  related,
  relatedLoading,
  relatedError,
  onOpen,
}: {
  finding: Finding
  related: Finding[]
  relatedLoading: boolean
  relatedError: boolean
  onOpen: (f: Finding) => void
}) {
  const isVideo = !!youtubeId(finding.source_url)
  const leader = leaderFrom(finding.source_url)
  const domain = sourceDomain(finding.source_url)

  return (
    <article
      className="mx-auto max-w-[44rem] bg-paper px-12 pb-28 pt-9 max-sm:px-5 sm:border-x sm:border-line"
      style={topicVars(sectionLabel(finding.agent)) as CSSProperties}
    >
      <div className="type-kicker flex items-center gap-2 text-[color:var(--tc-text)]">
        <span aria-hidden className="h-2 w-2 rounded-full bg-[var(--tc)]" />
        {sectionLabel(finding.agent)}
      </div>
      <h1
        className="type-display mt-2 text-[clamp(1.75rem,4vw,2.25rem)] leading-[1.02] tracking-[-0.02em] text-ink"
        style={{ fontVariationSettings: '"wdth" 112', fontWeight: 800 }}
      >
        {finding.title}
      </h1>

      <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1.5 border-b border-line pb-4 font-mono text-[0.6875rem] text-ink-faint">
        <span className="inline-flex items-center gap-1.5">
          <SourceFavicon url={finding.source_url} name={finding.source_name} />
          {sourceLabel(finding.source_name, finding.source_url)}
        </span>
        {leader && <ViaAvatar name={leader.name} avatar={leader.avatar} />}
        <span aria-hidden>·</span>
        <span className="uppercase">{finding.importance} signal</span>
      </div>

      {isVideo && finding.source_url && <VideoEmbed url={finding.source_url} title={finding.title} />}

      <p className="mt-6 font-serif text-[1.0625rem] leading-[1.72] text-ink-prose">
        {finding.summary}
      </p>

      {finding.source_url && (
        <div className="mt-7 border-t border-line pt-4">
          <p className="type-kicker text-ink-faint">Source</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {domain && (
              <Link
                href={`/source/${encodeURIComponent(domain)}`}
                className="inline-block rounded-full bg-panel px-4 py-2 font-mono text-[0.65625rem] font-semibold uppercase tracking-[0.1em] text-ink transition-all duration-[var(--dur-fast)] ease-[var(--ease-swift)] hover:-translate-y-0.5 hover:bg-ink hover:text-white focus-visible:outline-2 focus-visible:outline-ink focus-visible:outline-offset-2"
              >
                Source page
              </Link>
            )}
            <a
              href={finding.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block rounded-full bg-panel px-4 py-2 font-mono text-[0.65625rem] font-semibold uppercase tracking-[0.1em] text-ink transition-all duration-[var(--dur-fast)] ease-[var(--ease-swift)] hover:-translate-y-0.5 hover:bg-ink hover:text-white focus-visible:outline-2 focus-visible:outline-ink focus-visible:outline-offset-2"
            >
              {sourceLabel(finding.source_name, finding.source_url)}
            </a>
          </div>
        </div>
      )}

      <div className="mt-9 border-t-[3px] border-ink pt-4">
        <p className="type-kicker text-ink">
          <span className="text-primary">↳</span> Follow the thread
        </p>
        <div className="mt-3 flex flex-col">
          {relatedLoading && (
            <p className="py-2 font-mono text-[0.71875rem] text-ink-faint">Loading related signals...</p>
          )}
          {!relatedLoading && relatedError && (
            <p className="py-2 font-mono text-[0.71875rem] text-ink-faint">
              Related signals are unavailable right now.
            </p>
          )}
          {!relatedLoading && !relatedError && related.length === 0 && (
            <p className="py-2 font-mono text-[0.71875rem] text-ink-faint">No related signals yet.</p>
          )}
          {related.map((r) => (
            <button
              key={r.id}
              onClick={() => onOpen(r)}
              className="flood-row rule-row group grid grid-cols-[1fr_auto] gap-4 px-4 py-4 text-left active:scale-[0.99]"
              style={topicVars(sectionLabel(r.agent)) as CSSProperties}
            >
              <span className="block min-w-0">
                <span className="type-kicker block text-[color:var(--tc-text)]">
                  {r.connector_labels?.length ? r.connector_labels.join(' / ') : sectionLabel(r.agent)}
                </span>
                <span className="type-display mt-2 block text-[1.1875rem] leading-[1.1] text-ink">
                  {r.title}
                </span>
                <span className="type-kicker mt-2 block text-ink-faint">
                  {sourceLabel(r.source_name, r.source_url)}
                </span>
                {r.reason && (
                  <span className="mt-2 block font-serif text-[0.875rem] leading-[1.5] text-ink-soft">
                    {r.reason}
                  </span>
                )}
              </span>
              <span
                aria-hidden
                className="h-3 w-3 shrink-0 self-center rounded-full bg-[var(--tc)] transition-colors group-hover:bg-[var(--tc-on)] group-focus-within:bg-[var(--tc-on)]"
              />
            </button>
          ))}
        </div>
      </div>
    </article>
  )
}
