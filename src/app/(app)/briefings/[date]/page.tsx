import { ScrollDepthTracker } from '@/components/analytics/scroll-depth'
import type { Metadata } from 'next'
import type { CSSProperties } from 'react'
import Link from 'next/link'
import { getAudioBriefing, getReport, getReports, getStructuredIssue } from '@/lib/api'
import type { AudioBriefing, IssueStoryUnit, PublicIssue, Report, ReportListItem } from '@/lib/types'
import { JsonLd } from '@/components/json-ld'
import { AudioBriefingPlayer } from '@/components/briefing/audio-briefing-player'
import { ReportMarkdown } from '@/components/briefing/report-markdown'

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
import { topicVars } from '@/lib/topic-color'

export const revalidate = 60

type Params = { params: Promise<{ date: string }> }

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { date } = await params
  try {
    const report = await getReport(date)
    const description = shortReportDescription(report.title, date)
    return {
      title: report.title,
      description,
      alternates: { canonical: `/briefings/${date}` },
      openGraph: {
        type: 'article',
        title: report.title,
        description,
        url: `/briefings/${date}`,
        publishedTime: date,
      },
    }
  } catch {
    return { title: 'Briefing not found', robots: { index: false, follow: false } }
  }
}

export default async function BriefingPage({ params }: Params) {
  const { date } = await params

  let report: Report | null = null
  let list: ReportListItem[] = []
  let audio: AudioBriefing | null = null
  let issue: PublicIssue | null = null
  try {
    ;[report, list, audio, issue] = await Promise.all([
      getReport(date),
      getReports(),
      getAudioBriefing(date),
      getStructuredIssue(date),
    ])
  } catch {
    /* handled below */
  }

  if (!report) {
    return (
      <div className="mx-auto max-w-[44rem] px-8 py-16 text-center max-sm:px-5">
        <Link href="/briefings" className="type-kicker text-ink-soft transition-colors hover:text-ink">
          ← Briefings
        </Link>
        <p className="mt-10 font-mono text-[0.8125rem] uppercase tracking-[0.12em] text-ink-faint">
          The briefing for {date} could not be loaded.
        </p>
      </div>
    )
  }

  const wordCount = report.content.split(/\s+/).length
  const readTime = Math.max(1, Math.round(wordCount / 200))
  const dates = list.map((r) => r.date).sort()
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
          <p className="rise-in type-kicker mt-5 border-t-[3px] border-ink pt-3 text-ink-faint" style={{ '--i': 3 } as CSSProperties}>
            {wordCount.toLocaleString()} words · {readTime} min read
          </p>
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
                style={topicVars(prev) as CSSProperties}
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
                style={topicVars(next) as CSSProperties}
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
      <div className="flood-row rule-row" style={topicVars(story.slug) as CSSProperties}>
        <Link href={story.published_story.target_url} className="block px-4 py-4">
          {inner}
        </Link>
      </div>
    )
  }
  return (
    <div className="rule-row px-4 py-4" style={topicVars(story.slug) as CSSProperties}>
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
