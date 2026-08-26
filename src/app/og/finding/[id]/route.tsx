import { backendOutcome, getFinding } from '@/lib/api'
import { shortDate } from '@/lib/format'
import { sourceDomain } from '@/lib/sections'
import {
  NOT_FOUND_STATUS,
  UNAVAILABLE_STATUS,
  socialImageResponse,
} from '@/lib/social-image'
import { kickerLabel, topicForAgent } from '@/lib/topics'

export const revalidate = 3600

/**
 * Social card for a single finding.
 *
 * Same three-way split as the story card. A junk id is a cacheable 404; a
 * backend that did not answer is a 503 under a one-minute TTL, so a crawler
 * that arrives mid-outage does not pin the generic art on this id.
 */
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id: rawId } = await ctx.params
  const id = rawId.replace(/\.png$/i, '')
  const findingId = /^\d{1,12}$/.test(id) ? Number(id) : Number.NaN
  const outcome = Number.isSafeInteger(findingId)
    ? await backendOutcome(() => getFinding(findingId))
    : ({ status: 'missing' } as const)

  if (outcome.status !== 'ok') {
    if (outcome.status === 'unavailable') {
      console.warn('og/finding card unavailable', {
        id,
        kind: outcome.error.kind,
        path: outcome.error.path,
      })
    }
    return socialImageResponse({
      resolved: false,
      status: outcome.status === 'missing' ? NOT_FOUND_STATUS : UNAVAILABLE_STATUS,
    })
  }

  const finding = outcome.data
  const topic = topicForAgent(finding.agent)
  const refs = finding.source_refs?.length ?? 0

  return socialImageResponse({
    title: finding.title,
    kicker: kickerLabel(finding.agent),
    meta: [
      finding.run_date ? shortDate(finding.run_date) : null,
      sourceDomain(finding.source_url ?? null),
      refs > 1 ? `${refs} sources` : null,
    ],
    accent: topic?.fill,
    accentText: topic?.text,
    resolved: Boolean(finding.title),
  })
}
