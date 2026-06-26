/** Extract a YouTube video id from common URL shapes (server- and client-safe). */
export function youtubeId(url: string | null | undefined): string | null {
  if (!url) return null
  const m = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/,
  )
  return m ? m[1] : null
}
