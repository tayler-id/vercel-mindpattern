import { streamText, smoothStream, stepCountIs, convertToModelMessages } from 'ai'
import { openai } from '@ai-sdk/openai'
import { anthropic } from '@ai-sdk/anthropic'
import { mcpTools } from '@/lib/mcp-tools'
import { SYSTEM_PROMPT } from '@/lib/system-prompt'

export const maxDuration = 60

const MODELS = {
  openai: () => openai('gpt-4o'),
  anthropic: () => anthropic('claude-sonnet-4-20250514'),
} as const

export async function POST(req: Request) {
  const { messages, provider = 'openai' } = await req.json()

  const getModel = MODELS[provider as keyof typeof MODELS] ?? MODELS.openai

  const modelMessages = await convertToModelMessages(messages ?? [], {
    tools: mcpTools,
  })

  const result = streamText({
    model: getModel(),
    system: SYSTEM_PROMPT,
    messages: modelMessages,
    tools: mcpTools,
    stopWhen: stepCountIs(5),
    experimental_transform: smoothStream({ chunking: 'word' }),
  })

  return result.toUIMessageStreamResponse()
}
