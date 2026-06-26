'use client'

import { useState } from 'react'
import { youtubeId } from '@/lib/video'

/** Click-to-load YouTube player (privacy-light facade — no iframe until clicked). */
export function VideoEmbed({ url, title }: { url: string; title: string }) {
  const id = youtubeId(url)
  const [playing, setPlaying] = useState(false)
  if (!id) return null

  if (playing) {
    return (
      <div className="relative mt-6 aspect-video w-full overflow-hidden rounded-xl border border-line bg-black">
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1`}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="absolute inset-0 size-full"
        />
      </div>
    )
  }

  return (
    <button
      type="button"
      onClick={() => setPlaying(true)}
      aria-label={`Play video: ${title}`}
      className="group relative mt-6 block aspect-video w-full overflow-hidden rounded-xl border border-line bg-black"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`https://i.ytimg.com/vi/${id}/hqdefault.jpg`}
        alt=""
        className="absolute inset-0 size-full object-cover opacity-90 transition-opacity group-hover:opacity-100"
      />
      <span className="absolute inset-0 grid place-items-center">
        <span className="grid size-16 place-items-center rounded-full bg-primary/95 text-primary-foreground shadow-lg transition-transform group-hover:scale-105">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
            <path d="M8 5v14l11-7z" />
          </svg>
        </span>
      </span>
    </button>
  )
}
