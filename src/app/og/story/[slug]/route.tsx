import { getStory } from '@/lib/api'
import { socialImageResponse } from '@/lib/social-image'
import { kickerLabel, topicFor } from '@/lib/topics'

export const revalidate = 3600

export async function GET(_req: Request, ctx: { params: Promise<{ slug: string }> }) {
  const { slug: rawSlug } = await ctx.params
  const slug = rawSlug.replace(/\.png$/i, '')
  const story = await getStory(slug).catch(() => null)
  const kicker = [kickerLabel(story?.section_id), story?.issue_date].filter(Boolean).join(' · ')

  return socialImageResponse({
    title: story?.title,
    kicker,
    accent: topicFor(story?.section_id)?.fill,
  })
}
