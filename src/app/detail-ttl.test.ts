import { describe, expect, it } from 'vitest'

// The seven detail routes carry a day-long ISR TTL (86400s). That is only
// safe because the nightly publish purges what it changed via POST
// /api/revalidate. changed_site_paths in orchestrator/sync.py
// (mindpattern-v3) covers all seven kinds, the day's briefing, blog, story,
// source, arc, entity, and finding paths, capped at 200 with every dropped
// path logged. This test pins the value: dropping back to a short TTL sends
// the whole archive cold every hour again, and losing the export entirely
// makes Next re-render every click against the Fly backend.
const DETAIL_TTL_SECONDS = 86400

const detailRoutes: Array<[string, () => Promise<{ revalidate?: number }>]> = [
  ['/s/[slug]', () => import('./(app)/s/[slug]/page')],
  ['/e/[slug]', () => import('./(app)/e/[slug]/page')],
  ['/f/[id]', () => import('./(app)/f/[id]/page')],
  ['/source/[domain]', () => import('./(app)/source/[domain]/page')],
  ['/briefings/[date]', () => import('./(app)/briefings/[date]/page')],
  ['/blog/[date]', () => import('./(blog)/blog/[date]/page')],
  ['/arc/[id]', () => import('./(app)/arc/[id]/page')],
]

describe('detail route ISR TTLs', () => {
  it.each(detailRoutes)('%s revalidates daily', async (_route, load) => {
    const { revalidate } = await load()
    expect(revalidate).toBe(DETAIL_TTL_SECONDS)
  })
})
