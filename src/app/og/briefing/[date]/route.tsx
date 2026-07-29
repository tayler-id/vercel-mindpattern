import { getReport } from '@/lib/api'
import { socialImageResponse } from '@/lib/social-image'
import { topicFor } from '@/lib/topics'
import { shortDate } from '@/lib/format'

export const revalidate = 3600

/** Social card for a daily briefing — the shareable newsletter link. */
export async function GET(_req: Request, ctx: { params: Promise<{ date: string }> }) {
  const { date: rawDate } = await ctx.params
  const date = rawDate.replace(/\.png$/i, '')
  // The backend answers missing dates with a 200 `null` body, not a 404.
  const report = await getReport(date).catch(() => null)

  return socialImageResponse({
    title: report?.title,
    kicker: ['Daily Briefing', shortDate(date)].filter(Boolean).join(' · '),
    accent: topicFor(date)?.fill,
  })
}
