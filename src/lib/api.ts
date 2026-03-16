const BACKEND_URL = process.env.BACKEND_API_URL || 'https://mindpattern.fly.dev'

export async function backendFetch<T>(
  path: string,
  params?: Record<string, string>,
): Promise<T> {
  const url = new URL(path, BACKEND_URL)
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v) url.searchParams.set(k, v)
    })
  }
  const res = await fetch(url.toString(), {
    next: { revalidate: 60 },
  })
  if (!res.ok) throw new Error(`Backend ${res.status}: ${path}`)
  const data = await res.json()
  // The new FastAPI returns paginated responses as {items: [...], total, limit, offset}
  // Unwrap to flat arrays for frontend compatibility
  if (data && typeof data === 'object' && 'items' in data && Array.isArray(data.items)) {
    return data.items as T
  }
  return data as T
}
