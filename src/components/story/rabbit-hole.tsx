'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import type { Finding } from '@/lib/types'
import { sectionLabel, leaderFrom } from '@/lib/sections'
import { SourceFavicon } from '@/components/wire/source-favicon'
import { ViaAvatar } from '@/components/wire/via-avatar'
import { VideoEmbed } from '@/components/video/video-embed'
import { youtubeId } from '@/lib/video'

/**
 * Placeholder relatedness: other findings in the same section.
 * TODO(API): swap for /api/related/{id}?mode=semantic|graph once the v3 endpoint ships.
 */
function relatedFor(finding: Finding, pool: Finding[]): Finding[] {
  const sec = sectionLabel(finding.agent)
  const same = pool.filter((f) => f.id !== finding.id && sectionLabel(f.agent) === sec)
  const rest = pool.filter((f) => f.id !== finding.id && sectionLabel(f.agent) !== sec)
  return [...same, ...rest].slice(0, 6)
}

export function RabbitHole({ initial, pool }: { initial: Finding; pool: Finding[] }) {
  const [trail, setTrail] = useState<Finding[]>([initial])
  const scroller = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = scroller.current
    if (el) el.scrollTo({ left: el.scrollWidth, behavior: 'smooth' })
  }, [trail.length])

  const truncateTo = (i: number) => setTrail((t) => t.slice(0, i + 1))
  const open = (f: Finding) =>
    setTrail((t) => (f.id === t[t.length - 1].id ? t : [...t, f]))

  return (
    <div ref={scroller} className="flex h-full overflow-x-auto overflow-y-hidden">
      {trail.map((f, i) => {
        const isLast = i === trail.length - 1
        if (!isLast) {
          return (
            <button
              key={`${f.id}-${i}`}
              onClick={() => truncateTo(i)}
              className="hidden h-full w-[210px] shrink-0 overflow-y-auto border-r border-line bg-panel text-left transition-colors hover:bg-spine sm:block"
            >
              <div className="p-5">
                <div className="font-mono text-[0.625rem] tracking-[0.08em] text-ink-faint">
                  DEPTH {i + 1}
                </div>
                <div className="mt-3 font-mono text-[0.625rem] font-semibold uppercase tracking-[0.1em] text-primary">
                  {sectionLabel(f.agent)}
                </div>
                <div className="mt-1.5 line-clamp-4 text-[0.9rem] font-medium leading-snug text-ink-soft">
                  {f.title}
                </div>
                <div className="mt-3.5 font-mono text-[0.625rem] text-ink-faint">↩ reopen</div>
              </div>
            </button>
          )
        }
        return (
          <ReadingColumn
            key={`${f.id}-${i}`}
            finding={f}
            related={relatedFor(f, pool)}
            canBack={trail.length > 1}
            onBack={() => truncateTo(i - 1)}
            onOpen={open}
          />
        )
      })}
    </div>
  )
}

function ReadingColumn({
  finding,
  related,
  canBack,
  onBack,
  onOpen,
}: {
  finding: Finding
  related: Finding[]
  canBack: boolean
  onBack: () => void
  onOpen: (f: Finding) => void
}) {
  const isVideo = !!youtubeId(finding.source_url)
  const leader = leaderFrom(finding.source_url)
  const colRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    colRef.current?.scrollTo({ top: 0 })
  }, [finding.id])

  return (
    <div
      ref={colRef}
      className="h-full w-full shrink-0 animate-[fadein_.16s_ease] overflow-y-auto bg-surface sm:w-[min(44rem,94vw)] sm:shadow-[-20px_0_50px_-34px_rgba(11,13,18,.4)]"
    >
      <div className="mx-auto max-w-[40rem] px-12 pb-28 pt-10 max-sm:px-5">
        {canBack ? (
          <button
            onClick={onBack}
            className="mb-5 font-mono text-[0.78125rem] font-semibold text-primary active:opacity-60"
          >
            ← Back
          </button>
        ) : (
          <Link
            href="/"
            className="mb-5 inline-block font-mono text-[0.78125rem] font-semibold text-primary active:opacity-60"
          >
            ← The Wire
          </Link>
        )}

        <div className="font-mono text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-primary">
          {sectionLabel(finding.agent)}
        </div>
        <h1 className="mt-3 font-serif text-[2rem] font-semibold leading-[1.15] tracking-[-0.02em] text-ink max-sm:text-[1.6rem]">
          {finding.title}
        </h1>

        <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1.5 border-b border-line pb-4 font-mono text-[0.65625rem] text-ink-faint">
          <span className="inline-flex items-center gap-1.5">
            <SourceFavicon url={finding.source_url} name={finding.source_name} />
            {finding.source_name ?? 'web'}
          </span>
          {leader && <ViaAvatar name={leader.name} avatar={leader.avatar} />}
          <span aria-hidden>·</span>
          <span className="uppercase">{finding.importance} signal</span>
        </div>

        {isVideo && finding.source_url && <VideoEmbed url={finding.source_url} title={finding.title} />}

        <p className="mt-6 font-serif text-[1.0625rem] leading-[1.72] text-[#23262c]">
          {finding.summary}
        </p>

        {finding.source_url && (
          <div className="mt-7 border-t border-line pt-4">
            <p className="font-mono text-[0.625rem] uppercase tracking-[0.12em] text-ink-faint">Source</p>
            <a
              href={finding.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-block rounded-lg border border-line px-2.5 py-1.5 font-mono text-[0.71875rem] text-primary hover:border-primary hover:bg-accent-wash"
            >
              {finding.source_name ?? finding.source_url}
            </a>
          </div>
        )}

        <div className="mt-9 border-t border-line pt-5">
          <p className="font-mono text-[0.6875rem] font-semibold uppercase tracking-[0.12em] text-ink">
            <span className="text-primary">↳</span> Follow the thread
          </p>
          <div className="mt-3 flex flex-col gap-2">
            {related.length === 0 && (
              <p className="font-mono text-[0.71875rem] text-ink-faint">No related signals yet.</p>
            )}
            {related.map((r) => (
              <button
                key={r.id}
                onClick={() => onOpen(r)}
                className="group rounded-xl border border-line bg-surface px-4 py-3.5 text-left transition-colors hover:border-primary hover:bg-accent-wash"
              >
                <div className="font-mono text-[0.625rem] font-semibold uppercase tracking-[0.06em] text-primary">
                  {sectionLabel(r.agent)}
                </div>
                <div className="mt-1.5 text-[0.9375rem] font-semibold leading-snug tracking-[-0.01em] text-ink">
                  {r.title}
                </div>
                <div className="mt-1.5 font-mono text-[0.625rem] text-ink-faint">
                  {r.source_name ?? 'web'}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
