'use client'

import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import { useRef, useEffect, useState, useMemo } from 'react'
import { EmptyState } from './empty-state'
import { MessageContent } from './message-content'
import { Button } from '@/components/ui/button'
import { motion, AnimatePresence } from 'motion/react'

const PROVIDERS = [
  { id: 'openai', label: 'GPT-4o', icon: '◆' },
  { id: 'anthropic', label: 'Claude Sonnet', icon: '◈' },
] as const

type ProviderId = (typeof PROVIDERS)[number]['id']

export function ChatInterface() {
  const [provider, setProvider] = useState<ProviderId>('openai')
  const providerRef = useRef(provider)
  providerRef.current = provider

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: '/api/chat',
        body: () => ({ provider: providerRef.current }),
      }),
    [],
  )

  const { messages, sendMessage, status, stop } = useChat({ transport })

  const [input, setInput] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const handleSuggestion = (text: string) => {
    sendMessage({ text })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim()) return
    sendMessage({ text: input })
    setInput('')
  }

  const isStreaming = status === 'streaming'
  const currentProvider = PROVIDERS.find((p) => p.id === provider)!

  return (
    <div className="flex flex-col h-full">
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        {messages.length === 0 ? (
          <EmptyState onSuggestion={handleSuggestion} />
        ) : (
          <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
            <AnimatePresence initial={false}>
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`${
                      message.role === 'user'
                        ? 'bg-primary text-primary-foreground rounded-2xl rounded-br-md px-4 py-2 max-w-[80%]'
                        : 'max-w-full w-full'
                    }`}
                  >
                    {message.role === 'user' ? (
                      <p className="text-sm">
                        {message.parts.find((p) => p.type === 'text')?.text}
                      </p>
                    ) : (
                      <MessageContent message={message} />
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {isStreaming && messages[messages.length - 1]?.role !== 'assistant' && (
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <span className="inline-block w-2 h-2 rounded-full bg-primary animate-pulse" />
                Thinking...
              </div>
            )}
          </div>
        )}
      </div>

      <div className="border-t border-border bg-background/80 backdrop-blur-sm">
        <form id="chat-form" onSubmit={handleSubmit} className="max-w-3xl mx-auto px-4 py-4">
          <div className="relative flex items-end gap-2 bg-card border border-border rounded-2xl px-4 py-3 focus-within:border-primary/50 transition-colors">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleSubmit(e as unknown as React.FormEvent)
                }
              }}
              placeholder="Ask about your research..."
              rows={1}
              className="flex-1 bg-transparent resize-none outline-none text-sm max-h-32 min-h-[20px]"
              style={{ height: 'auto', overflow: 'hidden' }}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement
                target.style.height = 'auto'
                target.style.height = target.scrollHeight + 'px'
              }}
            />
            {isStreaming ? (
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={stop}
                className="shrink-0 h-8 w-8 p-0 rounded-lg"
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
                  <rect x="2" y="2" width="10" height="10" rx="2" />
                </svg>
              </Button>
            ) : (
              <Button
                type="submit"
                size="sm"
                disabled={!input.trim()}
                className="shrink-0 h-8 w-8 p-0 rounded-lg"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path
                    d="M14 2L7 9M14 2l-4.5 12L7 9M14 2L2 6.5 7 9"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </Button>
            )}
          </div>
          <div className="flex items-center justify-between mt-2 px-1">
            <div className="flex items-center gap-1">
              {PROVIDERS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setProvider(p.id)}
                  className={`text-[11px] px-2.5 py-1 rounded-md transition-colors ${
                    provider === p.id
                      ? 'bg-primary/15 text-primary font-medium'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                  }`}
                >
                  {p.icon} {p.label}
                </button>
              ))}
            </div>
            <p className="text-[11px] text-muted-foreground">
              Using {currentProvider.label}
            </p>
          </div>
        </form>
      </div>
    </div>
  )
}
