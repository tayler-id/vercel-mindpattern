'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

/** Cmd/Ctrl+K anywhere -> /search. */
export function SearchHotkey() {
  const router = useRouter()
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        router.push('/search')
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [router])
  return null
}
