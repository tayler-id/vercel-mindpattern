import { ScrollDepthTracker } from '@/components/analytics/scroll-depth'
import { topicFor, topicStyleVars } from '@/lib/topics'
import type { Metadata } from 'next'
import type { CSSProperties } from 'react'
import Link from 'next/link'
import { connection } from 'next/server'
import { notFound } from 'next/navigation'
import {
  getAudioBriefing,
  getReport,
  getStructuredIssue,
  isBackendNotFound,
  lookupArchive,
} from '@/lib/api'
import type { AudioBriefing, IssueStoryUnit, PublicIssue, Report } from '@/lib/types'
import { JsonLd } from '@/components/json-ld'
import { AudioBriefingPlayer } from '@/components/briefing/audio-briefing-player'
import { ReportMarkdown } from '@/components/briefing/report-markdown'
import { ShareButton } from '@/components/story/share-button'

/** Briefing bodies open with an h1 repeating the title — the page header
    already carries it, so showing both doubles the title and stacks rules. */
function stripLeadingTitle(content: string, title: string): string {
  const m = content.match(/^\s*#\s+(.+?)\s*\n+/)
  if (!m) return content
  const h1 = m[1].trim().toLowerCase()
  const t = title.trim().toLowerCase()
  if (h1 === t || h1.includes(t) || t.includes(h1)) return content.slice(m[0].length)
  return content
}
import { absoluteUrl, shortReportDescription, SITE_NAME } from '@/lib/site'
import { shortDate } from '@/lib/format'

export const revalidate = 3600

// Without generateStaticParams, Next 16 treats a dynamic segment as
// SSR-on-every-request and the revalidate export above is ignored — every
// click then re-renders against the Fly backend. An empty list keeps builds
// hermetic (no backend dependency) while opting every date into on-demand ISR.
export function generateStaticParams() {
  return []
}

type Params = { params: Promise<{ date: string }> }

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/

const BRIEFING_NOT_FOUND: Metadata = {
  title: 'Briefing not found',
  robots: { index: false, follow: false },
}

/** Names the briefing from the date alone, for a card built with no fetch. */
function titleForDate(date: string): string {
  return `Daily AI research briefing for ${date}`
}

// One card shape for the loaded briefing and for every degraded path. Each
// emits og:title, og:description, og:url, og:type, og:image with its
// dimensions, and a large twitter card. Degraded, the card keeps the right
// title, description and URL; the image falls back to the generic card, which
// `/og/briefing/[date]` ships under a short negative TTL so it is not pinned.
function briefingCard(date: string, title: string, degraded = false): Metadata {
  const canonical = `/briefings/${date}`
  const description = shortReportDescription(title, date)
  const images = [
    {
      url: `/og/briefing/${date}`,
      width: 1200,
      height: 630,
      type: 'image/png',
      alt: `${title} · ${SITE_NAME}`,
    },
  ]

  return {
    title,
    description,
    alternates: { canonical },
    // A date-shaped URL reaches the degraded shell whether or not it was ever
    // published, so a crawler must not index the retry page as the briefing.
    ...(degraded ? { robots: { index: false, follow: true } } : {}),
    openGraph: {
      type: 'article',
      siteName: SITE_NAME,
      title,
      description,
      url: canonical,
      publishedTime: date,
      images,
    },
    twitter: { card: 'summary_large_image', title, description, images },
  }
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { date } = await params
  if (!ISO_DATE_RE.test(date)) return BRIEFING_NOT_FOUND

  // Only an archive list that came back and does not name the date proves
  // absence. That check is also the fast path: the per-date endpoint takes up
  // to 10s to answer for a date that was never published.
  const archive = await lookupArchive(date)
  if (archive.state === 'absent') return BRIEFING_NOT_FOUND

  // The backend answers a missing date with a 200 `null` body, not a 404, but
  // keep the 404 branch: a proxy or a path change can still produce one, and
  // that is absence rather than a slow box.
  const report = await getReport(date).catch((err: unknown) => {
    if (isBackendNotFound(err)) return null
    return 'unreachable' as const
  })
  if (report === 'unreachable') {
    return briefingCard(date, archive.title ?? titleForDate(date), true)
  }
  return briefingCard(date, report?.title ?? archive.title ?? titleForDate(date))
}

/** Shown when the backend times out. A 200 with a way onward beats a 500. */
function BriefingUnavailable({ date }: { date: string }) {
  return (
    <div className="h-full overflow-y-auto">
      <main className="mx-auto max-w-[720px] px-8 pb-24 pt-11 max-sm:px-5">
        <Link href="/briefings" className="type-kicker inline-block text-ink-soft transition-colors hover:text-ink">
          ← Briefings
        </Link>
        <p className="type-kicker mt-6 text-primary">Wire interrupted</p>
        <h1
          className="type-display mt-2 text-[clamp(1.875rem,4vw,2.75rem)] leading-[1.05] tracking-[-0.015em] text-ink"
          style={{ fontVariationSettings: '"wdth" 114', fontWeight: 850 } as CSSProperties}
        >
          {shortDate(date)}
        </h1>
        <p className="mt-3 max-w-[56ch] font-serif text-[1.0625rem] leading-[1.5] text-ink-soft">
          The briefing for {date} could not be loaded. Retry in a minute, or open another issue from
          the archive.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <a
            href={`/briefings/${date}`}
            className="inline-block rounded-full bg-panel px-4 py-2 font-mono text-[0.65625rem] font-semibold uppercase tracking-[0.1em] text-ink hover:bg-ink hover:text-white focus-visible:outline-2 focus-visible:outline-ink focus-visible:outline-offset-2"
          >
            Retry
          </a>
          <Link
            href="/briefings"
            className="inline-block rounded-full bg-panel px-4 py-2 font-mono text-[0.65625rem] font-semibold uppercase tracking-[0.1em] text-ink hover:bg-ink hover:text-white focus-visible:outline-2 focus-visible:outline-ink focus-visible:outline-offset-2"
          >
            Briefing archive
          </Link>
          <Link
            href="/"
            className="inline-block rounded-full bg-panel px-4 py-2 font-mono text-[0.65625rem] font-semibold uppercase tracking-[0.1em] text-ink hover:bg-ink hover:text-white focus-visible:outline-2 focus-visible:outline-ink focus-visible:outline-offset-2"
          >
            The Wire
          </Link>
        </div>
      </main>
    </div>
  )
}

export default async function BriefingPage({ params }: Params) {
  const { date } = await params
  if (!ISO_DATE_RE.test(date)) notFound()

  // Dates the archive list rules out 404 immediately. The per-date endpoints
  // below take up to 10s to answer for unpublished dates.
  const archive = await lookupArchive(date)
  if (archive.state === 'absent') notFound()

  // The report is the page. A backend that answers "no such date" becomes a
  // (cacheable) not-found; a backend that does not answer at all renders the
  // unavailable state instead of a 500. Audio and the graph trail are
  // best-effort fragments.
  const [report, audio, issue]: [Report | null | 'unreachable', AudioBriefing | null, PublicIssue | null] =
    await Promise.all([
      getReport(date).catch((err: unknown) => (isBackendNotFound(err) ? null : ('unreachable' as const))),
      getAudioBriefing(date).catch(() => null),
      getStructuredIssue(date).catch(() => null),
    ])

  if (report === 'unreachable') {
    // `revalidate = 3600` would otherwise write this retry page into the full
    // route cache and serve it for an hour on a date that has real content,
    // making "retry in a minute" false. connection() keeps it out.
    await connection()
    return <BriefingUnavailable date={date} />
  }
  if (!report) notFound()

  const wordCount = report.content.split(/\s+/).length
  const readTime = Math.max(1, Math.round(wordCount / 200))
  const dates = archive.list.map((r) => r.date).sort()
  const i = dates.indexOf(date)
  const prev = i > 0 ? dates[i - 1] : null
  const next = i >= 0 && i < dates.length - 1 ? dates[i + 1] : null

  return (
    <div className="h-full overflow-y-auto">
      <div className="progress-rail" aria-hidden />
      <article className="mx-auto max-w-[720px] px-8 pb-24 pt-11 max-sm:px-5">
        <ScrollDepthTracker kind="briefing" id={date} />
        <JsonLd
          data={{
            '@context': 'https://schema.org',
            '@type': 'Article',
            '@id': absoluteUrl(`/briefings/${date}#article`),
            headline: report.title,
            description: shortReportDescription(report.title, date),
            url: absoluteUrl(`/briefings/${date}`),
            datePublished: date,
            dateModified: date,
            wordCount,
            inLanguage: 'en-US',
            author: { '@type': 'Organization', name: SITE_NAME, url: absoluteUrl('/') },
            publisher: { '@type': 'Organization', name: SITE_NAME, url: absoluteUrl('/') },
          }}
        />

        <Link href="/briefings" className="rise-in type-kicker inline-block text-ink-soft transition-colors hover:text-ink" style={{ '--i': 0 } as CSSProperties}>
          ← Briefings
        </Link>

        <header className="mb-8 mt-8">
          <p className="rise-in type-kicker text-primary" style={{ '--i': 1 } as CSSProperties}>
            {shortDate(date)}
          </p>
          <h1
            className="rise-in type-display mt-2 max-w-[24ch] text-[clamp(1.875rem,4vw,2.75rem)] leading-[1.05] tracking-[-0.015em] text-ink"
            style={{ '--i': 2, fontVariationSettings: '"wdth" 114', fontWeight: 850 } as CSSProperties}
          >
            {report.title}
          </h1>
          <div
            className="rise-in mt-5 flex flex-wrap items-center justify-between gap-x-6 gap-y-3 border-t-[3px] border-ink pt-3"
            style={{ '--i': 3 } as CSSProperties}
          >
            <p className="type-kicker text-ink-faint">
              {wordCount.toLocaleString()} words · {readTime} min read
            </p>
            <ShareButton title={report.title} url={`/briefings/${date}`} className="ml-auto" />
          </div>
        </header>

        {audio && <AudioBriefingPlayer audio={audio} />}

        <ReportMarkdown content={stripLeadingTitle(report.content, report.title)} />

        {issue && <BriefingGraphTrail issue={issue} />}

        {(prev || next) && (
          <nav className="mt-14 grid border-t-[3px] border-ink sm:grid-cols-2" aria-label="Adjacent briefings">
            {prev ? (
              <Link
                href={`/briefings/${prev}`}
                className="flood-row block px-4 py-4"
                style={topicStyleVars(topicFor(prev)) as CSSProperties}
              >
                <p className="type-kicker text-[color:var(--tc-text)]">← Previous issue</p>
                <p className="type-display mt-2 text-[1.25rem] uppercase text-ink">{shortDate(prev)}</p>
              </Link>
            ) : (
              <span aria-hidden />
            )}
            {next ? (
              <Link
                href={`/briefings/${next}`}
                className="flood-row block px-4 py-4 text-right"
                style={topicStyleVars(topicFor(next)) as CSSProperties}
              >
                <p className="type-kicker text-[color:var(--tc-text)]">Next issue →</p>
                <p className="type-display mt-2 text-[1.25rem] uppercase text-ink">{shortDate(next)}</p>
              </Link>
            ) : (
              <span aria-hidden />
            )}
          </nav>
        )}
      </article>
    </div>
  )
}

function BriefingGraphTrail({ issue }: { issue: PublicIssue }) {
  const sourceTrail = dedupeBy(issue.source_trail, (source) => source.domain).slice(0, 12)
  const entities = rankedIssueEntities(issue).slice(0, 16)
  const storyPaths = issue.story_units
    .filter((story) => story.source_refs.length > 0 || story.published_story)
    .slice(0, 8)

  if (sourceTrail.length === 0 && entities.length === 0 && storyPaths.length === 0) {
    return null
  }

  return (
    <section className="scroll-rise mt-14 border-t-[3px] border-ink pt-4" aria-labelledby="briefing-graph-trail">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 id="briefing-graph-trail" className="type-display text-[25px] uppercase leading-[1.04] text-ink">
            Graph trail
          </h2>
          <p className="mt-2 max-w-[38rem] font-serif text-[0.9375rem] leading-[1.6] text-ink-soft">
            Source, entity, and story paths extracted from this canonical briefing.
          </p>
        </div>
        <p className="type-kicker text-ink-faint">
          {issue.story_units.length} stories · {issue.source_trail.length} sources · {issue.entities.length} entities
        </p>
      </div>

      {storyPaths.length > 0 && (
        <div className="mt-7">
          <h3 className="type-kicker mb-2 text-primary">Story paths</h3>
          <div>
            {storyPaths.map((story) => (
              <StoryPathRow key={story.id} story={story} />
            ))}
          </div>
        </div>
      )}

      <div className="mt-7 grid gap-7 md:grid-cols-2">
        {entities.length > 0 && (
          <div>
            <h3 className="type-kicker text-primary">Entities</h3>
            <div className="mt-3 flex flex-wrap gap-3">
              {entities.map((entity) => (
                <Link
                  key={entity.slug}
                  href={`/e/${entity.slug}`}
                  className="inline-block rounded-full bg-panel px-4 py-2 font-mono text-[0.65625rem] font-semibold uppercase tracking-[0.1em] text-ink transition-all duration-[var(--dur-fast)] ease-[var(--ease-swift)] hover:-translate-y-0.5 hover:bg-ink hover:text-white focus-visible:outline-2 focus-visible:outline-ink focus-visible:outline-offset-2"
                >
                  {entity.name}
                </Link>
              ))}
            </div>
          </div>
        )}

        {sourceTrail.length > 0 && (
          <div>
            <h3 className="type-kicker text-primary">Sources</h3>
            <div className="mt-3 flex flex-wrap gap-3">
              {sourceTrail.map((source) => (
                <Link
                  key={source.domain}
                  href={`/source/${encodeURIComponent(source.domain)}`}
                  className="inline-block rounded-full bg-panel px-4 py-2 font-mono text-[0.65625rem] font-semibold uppercase tracking-[0.1em] text-ink transition-all duration-[var(--dur-fast)] ease-[var(--ease-swift)] hover:-translate-y-0.5 hover:bg-ink hover:text-white focus-visible:outline-2 focus-visible:outline-ink focus-visible:outline-offset-2"
                >
                  {source.domain}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  )
}

function StoryPathRow({ story }: { story: IssueStoryUnit }) {
  const sourceDomains = dedupeBy(story.source_refs, (source) => source.domain)
    .slice(0, 3)
    .map((source) => source.domain)

  const inner = (
    <>
      <h4 className="type-display text-[1.125rem] leading-[1.1] text-ink">{story.title}</h4>
      <p className="type-kicker mt-3 flex flex-wrap gap-x-4 gap-y-1 text-ink-faint">
        {story.published_story && <span>Public story</span>}
        {sourceDomains.length > 0 && <span>{sourceDomains.join(' · ')}</span>}
        {story.entity_ids.length > 0 && <span>{story.entity_ids.length} entities</span>}
      </p>
    </>
  )

  if (story.published_story) {
    return (
      <div className="flood-row rule-row" style={topicStyleVars(topicFor(story.slug)) as CSSProperties}>
        <Link href={story.published_story.target_url} className="block px-4 py-4">
          {inner}
        </Link>
      </div>
    )
  }
  return (
    <div className="rule-row px-4 py-4" style={topicStyleVars(topicFor(story.slug)) as CSSProperties}>
      {inner}
    </div>
  )
}

function dedupeBy<T>(items: T[], keyFn: (item: T) => string): T[] {
  const seen = new Set<string>()
  const result: T[] = []
  for (const item of items) {
    const key = keyFn(item)
    if (!key || seen.has(key)) continue
    seen.add(key)
    result.push(item)
  }
  return result
}

const ENTITY_DISPLAY_BLOCKLIST = new Set([
  'across',
  'agent',
  'agentic',
  'agents',
  'architecture',
  'benchmark',
  'build',
  'connect',
  'design',
  'download',
  'embedded',
  'enterprise',
  'everyone',
  'examples',
  'expose',
  'five',
  'frontier',
  'generation',
  'government',
  'grade',
  'ground',
  'harden',
  'hot-projects',
  'http',
  'infrastructure',
  'july',
  'keep',
  'kicking',
  'labs',
  'lock',
  'loop',
  'mark',
  'model',
  'models',
  'never',
  'nobody',
  'that',
  'they',
  'what',
  'worth',
])

function rankedIssueEntities(issue: PublicIssue) {
  const bySlug = new Map(issue.entities.map((entity) => [entity.slug, entity]))
  const counts = new Map<string, number>()
  for (const story of issue.story_units) {
    if (story.source_refs.length === 0) continue
    for (const id of story.entity_ids) {
      if (ENTITY_DISPLAY_BLOCKLIST.has(id)) continue
      counts.set(id, (counts.get(id) ?? 0) + 1)
    }
  }

  return [...counts.entries()]
    .map(([slug, count]) => ({ entity: bySlug.get(slug), count }))
    .filter((item): item is { entity: NonNullable<typeof item.entity>; count: number } => Boolean(item.entity))
    .sort((a, b) => b.count - a.count || a.entity.name.localeCompare(b.entity.name))
    .map((item) => item.entity)
}
