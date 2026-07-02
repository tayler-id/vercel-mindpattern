import { NextResponse } from 'next/server'
import type { NextFetchEvent, NextRequest } from 'next/server'

const BACKEND_URL = process.env.BACKEND_API_URL || 'https://mindpattern.fly.dev'

/** Known AI agents / crawlers, matched against the UA. Only the family
 *  name is ever recorded — the raw user agent is never stored. */
const AGENT_PATTERNS: [RegExp, string][] = [
  [/GPTBot/i, 'gptbot'],
  [/OAI-SearchBot/i, 'openai-search'],
  [/ChatGPT-User/i, 'chatgpt-user'],
  [/ClaudeBot|Claude-Web|anthropic-ai/i, 'claudebot'],
  [/Claude-User|Claude-SearchBot/i, 'claude-user'],
  [/PerplexityBot/i, 'perplexitybot'],
  [/Perplexity-User/i, 'perplexity-user'],
  [/Google-Extended/i, 'google-extended'],
  [/GoogleOther/i, 'google-other'],
  [/Googlebot/i, 'googlebot'],
  [/Bingbot/i, 'bingbot'],
  [/DuckAssistBot/i, 'duckassist'],
  [/Amazonbot/i, 'amazonbot'],
  [/Applebot-Extended/i, 'applebot-extended'],
  [/Applebot/i, 'applebot'],
  [/meta-externalagent|FacebookBot/i, 'meta'],
  [/Bytespider/i, 'bytespider'],
  [/CCBot/i, 'ccbot'],
  [/cohere/i, 'cohere'],
  [/MistralAI-User/i, 'mistral-user'],
  [/YouBot/i, 'youbot'],
  [/LinerBot/i, 'linerbot'],
]

export function middleware(request: NextRequest, event: NextFetchEvent) {
  const ua = request.headers.get('user-agent') ?? ''
  for (const [pattern, family] of AGENT_PATTERNS) {
    if (pattern.test(ua)) {
      event.waitUntil(
        fetch(`${BACKEND_URL}/api/event`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'agent_hit',
            target: family,
            path: request.nextUrl.pathname,
          }),
        }).catch(() => {}),
      )
      break
    }
  }
  return NextResponse.next()
}

export const config = {
  // Pages only — skip static assets and our own API routes.
  matcher: ['/((?!_next/|api/|favicon|.*\\.(?:png|jpg|svg|ico|css|js)$).*)'],
}
