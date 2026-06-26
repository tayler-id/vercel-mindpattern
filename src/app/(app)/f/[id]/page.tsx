import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getFinding } from '@/lib/api'
import { faviconFor } from '@/lib/favicon'
import { agentLabel, shortDate } from '@/lib/format'
import { VideoEmbed } from '@/components/video/video-embed'
import { youtubeId } from '@/lib/video'

export const revalidate = 60

type Params = { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { id } = await params
  const f = await getFinding(Number(id))
  if (!f) return { title: 'Finding not found' }
  return { title: f.title, description: f.summary.slice(0, 160) }
}

export default async function FindingPage({ params }: Params) {
  const { id } = await params
  const finding = await getFinding(Number(id))
  if (!finding) notFound()

  const fav = faviconFor(finding.source_url)
  const isVideo = !!youtubeId(finding.source_url)

  return (
    <div className="h-full overflow-y-auto">
      <article className="mx-auto max-w-[44rem] px-8 pb-24 pt-11 max-sm:px-5">
        <Link
          href="/"
          className="font-mono text-[0.78125rem] font-semibold text-primary hover:underline"
        >
          ← The Wire
        </Link>

        <p className="mt-8 font-mono text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-primary">
          {agentLabel(finding.agent)}
        </p>
        <h1 className="mt-3 font-serif text-[2rem] font-semibold leading-[1.15] tracking-[-0.02em] text-ink max-sm:text-[1.75rem]">
          {finding.title}
        </h1>

        <div className="mt-5 flex flex-wrap items-center gap-3 border-b border-line pb-5 font-mono text-[0.6875rem] text-ink-faint">
          {fav && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={fav} alt="" width={14} height={14} className="size-[14px] rounded-[3px] bg-spine" />
          )}
          {finding.source_name && <span>{finding.source_name}</span>}
          <span aria-hidden>·</span>
          <span>{shortDate(finding.run_date)}</span>
          <span aria-hidden>·</span>
          <span className="uppercase">{finding.importance} signal</span>
        </div>

        {isVideo && finding.source_url && (
          <VideoEmbed url={finding.source_url} title={finding.title} />
        )}

        <div className="mt-6 font-serif text-[1.0625rem] leading-[1.72] text-[#23262c]">
          {finding.summary}
        </div>

        {finding.source_url && (
          <div className="mt-7 border-t border-line pt-4">
            <p className="font-mono text-[0.625rem] uppercase tracking-[0.12em] text-ink-faint">
              Source
            </p>
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

        {/* Rabbit hole (semantic + graph related) lands in T10/M1. */}
        <div className="mt-9 border-t border-line pt-4">
          <p className="font-mono text-[0.6875rem] font-semibold uppercase tracking-[0.12em] text-ink">
            <span className="text-primary">↳</span> Follow the thread
          </p>
          <p className="mt-2 font-mono text-[0.71875rem] text-ink-faint">
            Related signals by meaning and connection arrive next (M1).
          </p>
        </div>
      </article>
    </div>
  )
}
