import { backendOutcome, getStory } from '@/lib/api'
import { shortDate } from '@/lib/format'
import {
  NOT_FOUND_STATUS,
  UNAVAILABLE_STATUS,
  socialImageResponse,
} from '@/lib/social-image'
import { kickerLabel, topicFor } from '@/lib/topics'

export const revalidate = 3600

const SLUG_RE = /^[a-z0-9][a-z0-9-]{0,127}$/i

/**
 * Social card for a published story.
 *
 * Three outcomes, three answers. A story draws its own card under the day-long
 * header. A slug the backend does not have gets the generic card with a 404, so
 * the CDN may hold it. A backend that did not answer gets the generic card with
 * a 503 and a one-minute TTL, because a 200 here is what let one 10s timeout
 * pin the generic art on a real story in every platform's unfurl cache, where
 * it outlives anything we control.
 */
export async function GET(_req: Request, ctx: { params: Promise<{ slug: string }> }) {
  const { slug: rawSlug } = await ctx.params
  const slug = rawSlug.replace(/\.png$/i, '')
  const outcome = SLUG_RE.test(slug)
    ? await backendOutcome(() => getStory(slug))
    : ({ status: 'missing' } as const)

  if (outcome.status !== 'ok') {
    if (outcome.status === 'unavailable') {
      console.warn('og/story card unavailable', {
        slug,
        kind: outcome.error.kind,
        path: outcome.error.path,
      })
    }
    return socialImageResponse({
      resolved: false,
      status: outcome.status === 'missing' ? NOT_FOUND_STATUS : UNAVAILABLE_STATUS,
    })
  }

  const story = outcome.data
  const topic = topicFor(story.section_id)
  const sources = story.source_refs?.length ?? 0

  return socialImageResponse({
    title: story.title,
    kicker: kickerLabel(story.section_id),
    meta: [
      story.issue_date ? shortDate(story.issue_date) : null,
      story.source_refs?.[0]?.domain,
      // The lead domain already names a single source.
      sources > 1 ? `${sources} sources` : null,
    ],
    accent: topic?.fill,
    accentText: topic?.text,
    resolved: Boolean(story.title),
  })
}
