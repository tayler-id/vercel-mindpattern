import type { Metadata } from 'next'
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
      <main className="mx-auto max-w-[760px] px-8 pb-24 pt-9 max-sm:px-5">
        <h1 className="type-display text-[2.5rem] font-[620] text-ink max-sm:text-[2rem]">Search</h1>
        <p className="mt-3 font-serif text-[1.0625rem] italic leading-[1.6] text-ink-soft">
          Stories, findings, entities, and sources. Semantic where it counts.
        </p>
        <Suspense>
          <SearchClient />
        </Suspense>
      </main>
    </div>
  )
}
