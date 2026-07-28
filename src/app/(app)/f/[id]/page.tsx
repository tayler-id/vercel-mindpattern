import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getFinding, getRelated } from '@/lib/api'
import { RabbitHole } from '@/components/story/rabbit-hole'
import { SITE_NAME } from '@/lib/site'

export const revalidate = 3600

// Opt into on-demand ISR — without this, Next 16 ignores the revalidate
// export and re-renders every finding click against the Fly backend.
export function generateStaticParams() {
  return []
}

type Params = { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { id } = await params
  const f = await getFinding(Number(id))
  if (!f) return { title: 'Finding not found', robots: { index: false } }
  const description = f.summary.slice(0, 160)
  const canonical = `/f/${f.id}`
  const ogImage = `/og/finding/${f.id}.png`
  const imageAlt = `${f.title} — ${SITE_NAME}`

  return {
    title: f.title,
    description,
    alternates: { canonical },
    openGraph: {
      title: f.title,
      description,
      type: 'article',
      siteName: SITE_NAME,
      url: canonical,
      publishedTime: f.run_date,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          type: 'image/png',
          alt: imageAlt,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: f.title,
      description,
      images: [{ url: ogImage, alt: imageAlt }],
    },
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
