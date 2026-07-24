'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import type { Finding, RelatedResponse } from '@/lib/types'
import { sectionLabel, leaderFrom, sourceDomain, sourceLabel } from '@/lib/sections'
import { kickerLabel } from '@/lib/topics'
import { SourceFavicon } from '@/components/wire/source-favicon'
import { ViaAvatar } from '@/components/wire/via-avatar'
import { VideoEmbed } from '@/components/video/video-embed'
import { ShareButton } from '@/components/story/share-button'
import { youtubeId } from '@/lib/video'


const GENERIC_CONNECTORS = new Set([
  'same source domain',
  'semantic neighbor',
  'shared topic',
  'same research window',
  'newsletter context',
])

/** At most the two most SPECIFIC connectors — never the seven-label wall. */
function threadKicker(labels: string[] | undefined, fallback: string): string {
  if (!labels || labels.length === 0) return fallback
  const specific = labels.filter((l) => !GENERIC_CONNECTORS.has(l.toLowerCase()))
  const picked = (specific.length > 0 ? specific : labels).slice(0, 2)
  return picked.join(' / ')
}

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
    // Honest linking: only findings drill in place. Stories, patterns, and
    // anything else navigate to their own page instead of masquerading as a
    // finding (which broke the thread 2 levels deep from source/entity paths).
    const url = (f as Finding & { target_url?: string }).target_url
    if (url && !url.startsWith('/f/')) {
      window.location.assign(url)
      return
    }
    if (!f.id || f.id === current.id) return
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
        className="sticky top-0 z-10 flex items-center gap-1.5 overflow-x-auto border-b border-line bg-paper/85 px-4 py-2.5 backdrop-blur-md [-ms-overflow-style:none] [scrollbar-width:none]"
      >
        <Link
          href="/"
          className="shrink-0 font-mono text-[0.65625rem] font-semibold uppercase tracking-[0.06em] text-primary"
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
                className={`max-w-[150px] truncate font-mono text-[0.65625rem] ${
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
    <article className="mx-auto max-w-[44rem] px-12 pb-28 pt-9 max-sm:px-5">
      <div className="font-mono text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-[color:var(--tc-text)]">
        {kickerLabel(finding.agent) || sectionLabel(finding.agent)}
      </div>
      <h1 className="type-display mt-2 max-w-[24ch] text-[clamp(1.625rem,3.5vw,2.125rem)] leading-[1.08] text-ink">
        {finding.title}
      </h1>

      <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1.5 border-b border-line pb-4 font-mono text-[0.65625rem] text-ink-faint">
        <span className="inline-flex items-center gap-1.5">
          <SourceFavicon url={finding.source_url} name={finding.source_name} />
          {sourceLabel(finding.source_name, finding.source_url)}
        </span>
        {leader && <ViaAvatar name={leader.name} avatar={leader.avatar} />}
        <span aria-hidden>·</span>
        <span className="uppercase">{finding.importance} signal</span>
        <ShareButton
          title={finding.title}
          url={`/f/${finding.id}`}
          className="ml-auto"
        />
      </div>

      {isVideo && finding.source_url && <VideoEmbed url={finding.source_url} title={finding.title} />}

      <p className="mt-6 font-serif text-[1.0625rem] leading-[1.72] text-ink-prose">
        {finding.summary}
      </p>

      {finding.source_url && (
        <div className="mt-7 border-t border-line pt-4">
          <p className="font-mono text-[0.625rem] uppercase tracking-[0.12em] text-ink-faint">Source</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {domain && (
              <Link
                href={`/source/${encodeURIComponent(domain)}`}
                className="inline-block rounded-lg border border-line px-2.5 py-1.5 font-mono text-[0.71875rem] text-ink hover:bg-ink hover:text-white"
              >
                Source page
              </Link>
            )}
            <a
              href={finding.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block rounded-lg border border-line px-2.5 py-1.5 font-mono text-[0.71875rem] text-ink hover:bg-ink hover:text-white"
            >
              {sourceLabel(finding.source_name, finding.source_url)}
            </a>
          </div>
        </div>
      )}

      <div className="mt-9 border-t border-line pt-5">
        <p className="font-mono text-[0.6875rem] font-semibold uppercase tracking-[0.12em] text-ink">
          <span className="text-primary">↳</span> Follow the thread
        </p>
        <div className="mt-3 flex flex-col gap-2">
          {relatedLoading && (
            <p className="font-mono text-[0.71875rem] text-ink-faint">Loading related signals...</p>
          )}
          {!relatedLoading && relatedError && (
            <p className="font-mono text-[0.71875rem] text-ink-faint">
              Related signals are unavailable right now.
            </p>
          )}
          {!relatedLoading && !relatedError && related.length === 0 && (
            <p className="font-mono text-[0.71875rem] text-ink-faint">No related signals yet.</p>
          )}
          {related.map((r) => (
            <button
              key={r.id}
              onClick={() => onOpen(r)}
              className="flood-row rule-row group w-full px-4 py-4 text-left transition-transform duration-(--dur-fast) focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ink active:scale-[0.99]"
            >
              <div className="type-kicker text-[0.625rem] text-[color:var(--tc-text)]">
                {threadKicker(r.connector_labels, sectionLabel(r.agent))}
              </div>
              <div
                className="type-display mt-1.5 text-[1.0625rem] leading-[1.15] text-ink"
                style={{ fontVariationSettings: '"wdth" 107', fontWeight: 720 }}
              >
                {r.title}
              </div>
              <div className="mt-1.5 font-mono text-[0.625rem] uppercase tracking-[0.08em] text-ink-faint">
                {sourceLabel(r.source_name, r.source_url)}
              </div>
            </button>
          ))}
        </div>
      </div>
    </article>
  )
}
