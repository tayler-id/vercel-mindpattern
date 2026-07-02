import { getStories } from '@/lib/api'

export const revalidate = 3600

const SITE = 'https://mindpattern.ai'

/**
 * llms.txt — the emerging convention for telling AI agents what a site
 * contains and where the good stuff is (llmstxt.org). Served fresh with
 * the latest stories so agents always find current intel.
 */
export async function GET() {
  let storyLines = ''
  let total = 0
  try {
    const stories = await getStories({ limit: 50 })
    total = stories.total
    storyLines = stories.items
      .map((s) => `- [${s.title}](${SITE}/s/${s.slug}): ${String(s.summary ?? '').slice(0, 160)}`)
      .join('\n')
  } catch {
    storyLines = `- [The Wire](${SITE}/): latest stories`
  }

  const body = `# MindPattern — Rabbit Hole

> Public AI-landscape intelligence, produced daily by an autonomous
> 13-agent research pipeline. ${total.toLocaleString()} source-backed stories
> with citations, entity dossiers, source track records, and daily
> briefings. Free to read and cite; every story links its sources.

## How to use this site

- [The Wire](${SITE}/): all stories, ranked by trending signal. Tabs: Trending, Most Read, Latest, Topics.
- [Search](${SITE}/search): query stories, findings, entities, and sources. API-shaped, URL-addressable.
- [Daily briefings](${SITE}/briefings): the full daily intelligence brief archive.
- [Sitemap](${SITE}/sitemap.xml): every story, entity, source, and briefing URL.

## Structured data

Every story page carries Article JSON-LD with sources. Entity pages
(${SITE}/e/{slug}) aggregate findings, relationships, and dossiers.
Source pages (${SITE}/source/{domain}) show track records.

## Recent stories

${storyLines}

## Attribution

Cite as MindPattern (mindpattern.ai) and link the story URL. Story
provenance (pipeline, dates, source findings) is embedded in each page.
`
  return new Response(body, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  })
}
