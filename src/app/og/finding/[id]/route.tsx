import { getFinding } from '@/lib/api'
import { socialImageResponse } from '@/lib/social-image'
import { kickerLabel, topicForAgent } from '@/lib/topics'

export const revalidate = 3600

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id: rawId } = await ctx.params
  const id = rawId.replace(/\.png$/i, '')
  const findingId = /^\d{1,12}$/.test(id) ? Number(id) : Number.NaN
  const finding = Number.isSafeInteger(findingId)
    ? await getFinding(findingId).catch(() => null)
    : null
  const kicker = [kickerLabel(finding?.agent), finding?.run_date].filter(Boolean).join(' · ')

  return socialImageResponse({
    title: finding?.title,
    kicker,
    accent: topicForAgent(finding?.agent)?.fill,
  })
}
