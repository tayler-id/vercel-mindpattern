import { socialImageResponse } from '@/lib/social-image'
import { resolveWireView, WIRE_HEADING } from '@/lib/wire-views'

export const revalidate = 3600

/** Social card for a shared wire view (trending / latest / topics / most read). */
export async function GET(_req: Request, ctx: { params: Promise<{ view: string }> }) {
  const { view: rawView } = await ctx.params
  const view = resolveWireView(rawView.replace(/\.png$/i, ''))
  const heading = WIRE_HEADING[view]

  return socialImageResponse({
    title: `${heading.h1} — ${heading.sub}`,
    kicker: 'The Wire · Live',
  })
}
