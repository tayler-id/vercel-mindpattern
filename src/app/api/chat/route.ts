import { streamText, smoothStream, stepCountIs, convertToModelMessages } from 'ai'
import { anthropic } from '@ai-sdk/anthropic'
import { mcpTools } from '@/lib/mcp-tools'
import { SYSTEM_PROMPT } from '@/lib/system-prompt'

export const maxDuration = 60

const RESEND_API_KEY = process.env.RESEND_API_KEY

function notifyApiError(error: unknown) {
  if (!RESEND_API_KEY) return

  const message = error instanceof Error ? error.message : String(error)
  const isRateLimit = message.includes('429') || message.toLowerCase().includes('rate')
  const isAuth = message.includes('401') || message.toLowerCase().includes('auth')

  const subject = isRateLimit
    ? 'MindPattern: Claude API rate limit hit'
    : isAuth
      ? 'MindPattern: Claude API auth error'
      : 'MindPattern: Claude API error'

  fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'MindPattern <feedback@tayler.id>',
      to: ['ramsay.tayler@gmail.com'],
      subject,
      text: `The Claude API returned an error on mindpattern.ai.\n\nError: ${message}\nTime: ${new Date().toISOString()}`,
    }),
  }).catch(() => {})
}

export async function POST(req: Request) {
  const { messages, provider = 'anthropic' } = await req.json()

  const modelMessages = await convertToModelMessages(messages ?? [], {
    tools: mcpTools,
  })

  try {
    const result = streamText({
      model: anthropic('claude-sonnet-4-20250514'),
      system: SYSTEM_PROMPT,
      messages: modelMessages,
      tools: mcpTools,
      stopWhen: stepCountIs(5),
      experimental_transform: smoothStream({ chunking: 'word' }),
    })

    return result.toUIMessageStreamResponse()
  } catch (error) {
    notifyApiError(error)

    const message = error instanceof Error ? error.message : 'Unknown error'
    const status =
      message.includes('429') ? 429 :
      message.includes('401') ? 401 : 500

    return new Response(
      JSON.stringify({ error: message }),
      { status, headers: { 'Content-Type': 'application/json' } },
    )
  }
}
