import type { Metadata } from 'next'
import Link from 'next/link'
import { getAudioBriefing, getReport, getReports, getStructuredIssue } from '@/lib/api'
import type { AudioBriefing, IssueStoryUnit, PublicIssue, Report, ReportListItem } from '@/lib/types'
import { JsonLd } from '@/components/json-ld'
import { AudioBriefingPlayer } from '@/components/briefing/audio-briefing-player'
import { ReportMarkdown } from '@/components/briefing/report-markdown'
import { absoluteUrl, shortReportDescription, SITE_NAME } from '@/lib/site'
import { shortDate } from '@/lib/format'

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
        <Link href="/briefings" className="font-mono text-[0.78125rem] font-semibold text-primary hover:underline">
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
      <article className="mx-auto max-w-[44rem] px-8 pb-24 pt-11 max-sm:px-5">
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

        <Link href="/briefings" className="font-mono text-[0.78125rem] font-semibold text-primary hover:underline">
          ← Briefings
        </Link>

        <header className="mb-8 mt-8 border-b border-line pb-6">
          <p className="font-mono text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-primary">
            {shortDate(date)}
          </p>
          <h1 className="mt-3 font-serif text-[2.5rem] font-semibold leading-[1.1] tracking-[-0.02em] text-ink max-sm:text-[2rem]">
            {report.title}
          </h1>
          <p className="mt-3 font-mono text-[0.6875rem] text-ink-faint">
            {wordCount.toLocaleString()} words · {readTime} min read
          </p>
        </header>

        {audio && <AudioBriefingPlayer audio={audio} />}

        <ReportMarkdown content={report.content} />

        {issue && <BriefingGraphTrail issue={issue} />}

        {(prev || next) && (
          <nav className="mt-12 flex items-center justify-between gap-4 border-t border-line pt-6 font-mono text-[0.71875rem] font-semibold">
            {prev ? (
              <Link href={`/briefings/${prev}`} className="text-primary hover:underline">
                ← {shortDate(prev)}
              </Link>
            ) : (
              <span />
            )}
            {next ? (
              <Link href={`/briefings/${next}`} className="text-primary hover:underline">
                {shortDate(next)} →
              </Link>
            ) : (
              <span />
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
    <section className="mt-12 border-t border-line pt-8" aria-labelledby="briefing-graph-trail">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 id="briefing-graph-trail" className="font-mono text-[0.8125rem] font-semibold uppercase text-ink">
            Graph trail
          </h2>
          <p className="mt-2 max-w-[38rem] text-[0.9375rem] leading-[1.6] text-ink-soft">
            Source, entity, and story paths extracted from this canonical briefing.
          </p>
        </div>
        <p className="font-mono text-[0.6875rem] uppercase text-ink-faint">
          {issue.story_units.length} stories · {issue.source_trail.length} sources · {issue.entities.length} entities
        </p>
      </div>

      {storyPaths.length > 0 && (
        <div className="mt-7">
          <h3 className="font-mono text-[0.71875rem] font-semibold uppercase text-primary">Story paths</h3>
          <div className="mt-3 divide-y divide-line">
            {storyPaths.map((story) => (
              <StoryPathRow key={story.id} story={story} />
            ))}
          </div>
        </div>
      )}

      <div className="mt-7 grid gap-7 md:grid-cols-2">
        {entities.length > 0 && (
          <div>
            <h3 className="font-mono text-[0.71875rem] font-semibold uppercase text-primary">Entities</h3>
            <div className="mt-3 flex flex-wrap gap-2">
              {entities.map((entity) => (
                <Link
                  key={entity.slug}
                  href={`/e/${entity.slug}`}
                  className="border border-line px-2.5 py-1 font-mono text-[0.71875rem] text-ink hover:border-primary hover:text-primary"
                >
                  {entity.name}
                </Link>
              ))}
            </div>
          </div>
        )}

        {sourceTrail.length > 0 && (
          <div>
            <h3 className="font-mono text-[0.71875rem] font-semibold uppercase text-primary">Sources</h3>
            <div className="mt-3 flex flex-wrap gap-2">
              {sourceTrail.map((source) => (
                <Link
                  key={source.domain}
                  href={`/source/${encodeURIComponent(source.domain)}`}
                  className="border border-line px-2.5 py-1 font-mono text-[0.71875rem] text-ink hover:border-primary hover:text-primary"
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

  return (
    <div className="py-3">
      {story.published_story ? (
        <Link
          href={story.published_story.target_url}
          className="text-[1rem] font-semibold leading-snug text-ink hover:text-primary"
        >
          {story.title}
        </Link>
      ) : (
        <div className="text-[1rem] font-semibold leading-snug text-ink">{story.title}</div>
      )}
      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 font-mono text-[0.6875rem] uppercase text-ink-faint">
        {story.published_story && <span>Public story</span>}
        {sourceDomains.length > 0 && <span>{sourceDomains.join(' · ')}</span>}
        {story.entity_ids.length > 0 && <span>{story.entity_ids.length} entities</span>}
      </div>
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
