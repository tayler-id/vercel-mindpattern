import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getFinding, getRelated } from '@/lib/api'
import { RabbitHole } from '@/components/story/rabbit-hole'

export const revalidate = 60

type Params = { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { id } = await params
  const f = await getFinding(Number(id))
  if (!f) return { title: 'Finding not found', robots: { index: false } }
  return {
    title: f.title,
    description: f.summary.slice(0, 160),
    alternates: { canonical: `/f/${f.id}` },
  }
}

export default async function FindingPage({ params }: Params) {
  const { id } = await params
  const [finding, related] = await Promise.all([
    getFinding(Number(id)),
    getRelated(Number(id), { limit: 8 }),
  ])
  if (!finding) notFound()

  return (
    <div className="h-full">
      <RabbitHole initial={finding} initialRelated={related.items} />
    </div>
  )
}
