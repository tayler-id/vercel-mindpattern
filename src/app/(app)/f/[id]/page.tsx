import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getFinding, getFindings } from '@/lib/api'
import type { Finding } from '@/lib/types'
import { RabbitHole } from '@/components/story/rabbit-hole'

export const revalidate = 60

type Params = { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { id } = await params
  const f = await getFinding(Number(id))
  if (!f) return { title: 'Finding not found' }
  return { title: f.title, description: f.summary.slice(0, 160) }
}

export default async function FindingPage({ params }: Params) {
  const { id } = await params
  const [finding, high, recent] = await Promise.all([
    getFinding(Number(id)),
    getFindings({ importance: 'high', limit: 80 }).catch(() => [] as Finding[]),
    getFindings({ limit: 120 }).catch(() => [] as Finding[]),
  ])
  if (!finding) notFound()

  // Dedupe a pool for placeholder relatedness (swapped for /api/related later).
  const seen = new Set<number>()
  const pool: Finding[] = []
  for (const f of [finding, ...high, ...recent]) {
    if (!seen.has(f.id)) {
      seen.add(f.id)
      pool.push(f)
    }
  }

  return (
    <div className="h-full">
      <RabbitHole initial={finding} pool={pool} />
    </div>
  )
}
