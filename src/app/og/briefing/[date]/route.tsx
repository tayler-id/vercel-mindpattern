import { backendOutcome, getReport } from '@/lib/api'
import { shortDate } from '@/lib/format'
import {
  NOT_FOUND_STATUS,
  UNAVAILABLE_STATUS,
  socialImageResponse,
} from '@/lib/social-image'

export const revalidate = 3600

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/

/** Sections of a briefing, counted from its `##` headings. */
function sectionCount(content: string | null | undefined): number {
  return (content?.match(/^##\s+\S/gm) ?? []).length
}

/**
 * Social card for a daily briefing, the shareable newsletter link.
 *
 * The segment is validated before anything is drawn or fetched: `shortDate`
 * returns its input unchanged when it will not parse, so an unguarded segment
 * became arbitrary text on a MindPattern-branded 1200x630 image.
 *
 * A date the pipeline has not published gets a cacheable 404, a backend that
 * did not answer gets a 503 under a one-minute TTL. That matters most for
 * today's date before the 7 AM run, which is a linked URL every morning.
 */
export async function GET(_req: Request, ctx: { params: Promise<{ date: string }> }) {
  const { date: rawDate } = await ctx.params
  const date = rawDate.replace(/\.png$/i, '')
  // The backend answers missing dates with a 200 `null` body, not a 404.
  const outcome = ISO_DATE_RE.test(date)
    ? await backendOutcome(() => getReport(date))
    : ({ status: 'missing' } as const)

  if (outcome.status !== 'ok') {
    if (outcome.status === 'unavailable') {
      console.warn('og/briefing card unavailable', {
        date,
        kind: outcome.error.kind,
        path: outcome.error.path,
      })
    }
    return socialImageResponse({
      kicker: 'Daily briefing',
      meta: [ISO_DATE_RE.test(date) ? shortDate(date) : null],
      resolved: false,
      status: outcome.status === 'missing' ? NOT_FOUND_STATUS : UNAVAILABLE_STATUS,
    })
  }

  const report = outcome.data
  const sections = sectionCount(report.content)

  return socialImageResponse({
    title: report.title,
    kicker: 'Daily briefing',
    meta: [shortDate(date), sections ? `${sections} sections` : null],
    resolved: Boolean(report.title),
  })
}
