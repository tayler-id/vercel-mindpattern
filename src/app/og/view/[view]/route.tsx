import { getPopular, getStories, getTrending } from '@/lib/api'
import { shortDate } from '@/lib/format'
import { socialImageResponse } from '@/lib/social-image'
import { resolveWireView, WIRE_HEADING, type WireView } from '@/lib/wire-views'
import type { PublicStory } from '@/lib/types'

export const revalidate = 3600

/**
 * The lead story for a view, or null when the backend is unreachable.
 *
 * `topics` groups the same corpus rather than reordering it, so it shares the
 * trending lead — there is no "top topic" story to speak of.
 */
async function leadStory(view: WireView): Promise<PublicStory | null> {
  const fetchLead =
    view === 'most-read'
      ? () => getPopular({ limit: 1 })
      : view === 'latest'
        ? () => getStories({ limit: 1 })
        : () => getTrending({ limit: 1 })

  const response = await fetchLead().catch(() => null)
  return response?.items?.[0] ?? null
}

/**
 * Social card for a shared wire view (trending / latest / topics / most read).
 *
 * The card leads with the actual top story. It used to render the on-page
 * column heading, which meant every share of the bare domain unfurled as
 * "Trending now: reader signal + source recurrence" — a description of the
 * ranking method, which tells a reader nothing about what is on the page.
 * When the backend is down the view's own share line stands in, so a slow
 * backend costs the headline, never the card.
 */
export async function GET(_req: Request, ctx: { params: Promise<{ view: string }> }) {
  const { view: rawView } = await ctx.params
  const view = resolveWireView(rawView.replace(/\.png$/i, ''))
  const heading = WIRE_HEADING[view]
  const story = await leadStory(view)

  return socialImageResponse({
    title: story?.title || heading.share,
    kicker: story
      ? [heading.h1, shortDate(story.issue_date)].filter(Boolean).join(' · ')
      : 'The Wire · Live',
    // Resolved either way. The view's own share line is real copy written for
    // this page, not the generic site title, so it is worth caching for a day.
    resolved: true,
  })
}
