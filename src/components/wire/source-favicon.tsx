'use client'

import { useState } from 'react'
import { faviconFor } from '@/lib/favicon'

/** Source favicon with a colored letter-badge fallback (matches the prototype's .fav.fb). */
export function SourceFavicon({
  url,
  name,
}: {
  url: string | null
  name: string | null
}) {
  const src = faviconFor(url, 64)
  const [failed, setFailed] = useState(false)
  const letter = (name || url || 'web')
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .charAt(0)
    .toUpperCase()

  if (!src || failed) {
    return (
      <span className="inline-grid size-[15px] place-items-center rounded-[4px] bg-primary text-[8px] font-bold leading-none text-primary-foreground">
        {letter}
      </span>
    )
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt=""
      width={15}
      height={15}
      loading="lazy"
      onError={() => setFailed(true)}
      className="size-[15px] rounded-[4px] border border-line bg-surface object-cover"
    />
  )
}
