'use client'

import { useState } from 'react'

export function ViaAvatar({ name, avatar }: { name: string; avatar: string }) {
  const [failed, setFailed] = useState(false)
  const initial = name.replace('@', '').charAt(0).toUpperCase()
  return (
    <span className="inline-flex items-center gap-1.5">
      {failed ? (
        <span className="grid size-4 place-items-center rounded-full bg-spine text-[8px] font-bold text-ink-soft">
          {initial}
        </span>
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={avatar}
          alt=""
          width={16}
          height={16}
          loading="lazy"
          onError={() => setFailed(true)}
          className="size-4 rounded-full bg-spine object-cover"
        />
      )}
      <span>via {name}</span>
    </span>
  )
}
