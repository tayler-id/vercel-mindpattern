import { anthropic } from '@ai-sdk/anthropic'
import { streamText } from 'ai'

export const maxDuration = 60

interface AskSource {
  title: string
  summary?: string
  date?: string
  url?: string
}

const SYSTEM = `You are the MindPattern analyst. You answer questions about the AI landscape using ONLY the intelligence excerpts provided. This corpus comes from an autonomous research pipeline that reads sources daily.

Rules:
- Ground every claim in the provided excerpts. Cite with bracketed numbers like [1], [2] matching the source list. Never invent facts, dates, numbers, or sources.
- If the excerpts don't answer the question, say so plainly and point to the closest related intel instead.
- Voice: direct, technical, opinionated where the evidence supports it. Contractions are required. Never use em dashes. No filler phrases like "it's worth noting" or "in the rapidly evolving landscape".
- Keep it tight: a few short paragraphs at most. Lead with the answer.`

export async function POST(request: Request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json(
      { error: 'Ask is not enabled: ANTHROPIC_API_KEY is not configured.' },
      { status: 503 },
    )
  }

  let q = ''
  let sources: AskSource[] = []
  try {
    const body = await request.json()
    q = String(body.q ?? '').slice(0, 300)
    if (Array.isArray(body.sources)) {
      sources = body.sources.slice(0, 12).map((s: AskSource) => ({
        title: String(s.title ?? '').slice(0, 200),
        summary: String(s.summary ?? '').slice(0, 500),
        date: String(s.date ?? '').slice(0, 10),
        url: String(s.url ?? '').slice(0, 300),
      }))
    }
  } catch {
    return Response.json({ error: 'Bad request' }, { status: 400 })
  }
  if (!q.trim() || sources.length === 0) {
    return Response.json({ error: 'Need a question and sources' }, { status: 400 })
  }

  const evidence = sources
    .map((s, i) => `[${i + 1}] ${s.title} (${s.date ?? 'undated'})\n${s.summary ?? ''}`)
    .join('\n\n')

  const result = streamText({
    model: anthropic('claude-opus-4-8'),
    system: SYSTEM,
    prompt: `Intelligence excerpts:\n\n${evidence}\n\nQuestion: ${q}`,
    maxOutputTokens: 1024,
  })

  return result.toTextStreamResponse()
}
