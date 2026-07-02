'use client'

import { useRouter } from 'next/navigation'
import { useRef } from 'react'

/** Compact search box in the header of every page. Enter -> /search. */
export function HeaderSearch() {
  const router = useRouter()
  const ref = useRef<HTMLInputElement>(null)

  return (
    <form
      role="search"
      className="ml-auto hidden sm:block"
      onSubmit={(e) => {
        e.preventDefault()
        const q = ref.current?.value.trim()
        router.push(q ? `/search?q=${encodeURIComponent(q)}` : '/search')
      }}
    >
      <input
        ref={ref}
        type="search"
        placeholder="Search…  ⌘K"
        aria-label="Search the site"
        className="w-40 rounded-full border border-line bg-surface px-3.5 py-1.5 font-mono text-[0.75rem] text-ink outline-none transition-[width,border-color] focus:w-64 focus:border-primary"
      />
    </form>
  )
}
