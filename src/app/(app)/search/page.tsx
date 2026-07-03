import type { Metadata } from 'next'
import type { CSSProperties } from 'react'
import { Suspense } from 'react'
import { SearchClient } from '@/components/search/search-client'

export const metadata: Metadata = {
  title: 'Search',
  description: 'Search stories, findings, entities, and sources across the MindPattern public graph.',
  alternates: { canonical: '/search' },
}

export default function SearchPage() {
  return (
    <div className="h-full overflow-y-auto">
      <main className="mx-auto max-w-[720px] px-8 pb-24 pt-9 max-sm:px-5">
        <h1
          className="rise-in type-display text-[clamp(2.5rem,6vw,4.25rem)] uppercase leading-[0.95] tracking-[-0.02em] text-ink"
          style={{ fontVariationSettings: '"wdth" 118', fontWeight: 850 }}
        >
          Search
        </h1>
        <p className="rise-in mt-2 max-w-[52ch] font-serif text-[1.1875rem] leading-[1.5] text-ink-soft" style={{ '--i': 1 } as CSSProperties}>
          Stories, findings, entities, and sources. Semantic where it counts.
        </p>
        <Suspense>
          <SearchClient />
        </Suspense>
      </main>
    </div>
  )
}
