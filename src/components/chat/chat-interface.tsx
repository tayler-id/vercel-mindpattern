'use client'

import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import { useRef, useEffect, useState, useMemo } from 'react'
import { Send, Square } from 'lucide-react'
import { EmptyState } from './empty-state'
import { MessageContent } from './message-content'
import { Button } from '@/components/ui/button'
import { motion, AnimatePresence } from 'motion/react'

const PROVIDERS = [
  { id: 'openai', label: 'GPT-4o', code: 'OAI' },
  { id: 'anthropic', label: 'Claude Sonnet', code: 'ANT' },
] as const

type ProviderId = (typeof PROVIDERS)[number]['id']

export function ChatInterface() {
  const [provider, setProvider] = useState<ProviderId>('anthropic')
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

  const { messages, sendMessage, status, stop } = useChat({ transport, experimental_throttle: 50 })

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

  const handleBlur = () => {
    // iOS Safari zooms in on inputs < 16px but doesn't zoom back out on keyboard dismiss.
    // Briefly constrain max scale to force zoom reset, then restore.
    const viewport = document.querySelector('meta[name="viewport"]')
    if (viewport) {
      const original = viewport.getAttribute('content') || ''
      viewport.setAttribute('content', original + ', maximum-scale=1')
      requestAnimationFrame(() => {
        setTimeout(() => {
          viewport.setAttribute('content', original)
        }, 100)
      })
    }
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
          <div className="max-w-3xl mx-auto px-4 py-6 flex flex-col gap-6">
            <AnimatePresence initial={false}>
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={
                      message.role === 'user'
                        ? 'bg-card border border-border dossier-card px-4 py-2.5 max-w-[80%]'
                        : 'max-w-full w-full'
                    }
                  >
                    {message.role === 'user' ? (
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] uppercase tracking-[0.15em] text-primary font-bold">
                          Operator
                        </span>
                        <p className="text-xs text-foreground">
                          {message.parts.find((p) => p.type === 'text')?.text}
                        </p>
                      </div>
                    ) : (
                      <MessageContent message={message} isStreaming={isStreaming && message.id === messages[messages.length - 1]?.id} />
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {isStreaming && messages[messages.length - 1]?.role !== 'assistant' && (
              <div className="flex items-center gap-2 text-muted-foreground text-xs uppercase tracking-wider">
                <span className="typewriter-cursor font-bold">_</span>
                Processing query...
              </div>
            )}
          </div>
        )}
      </div>

      <div className="border-t border-border bg-card/80 backdrop-blur-sm">
        <form id="chat-form" onSubmit={handleSubmit} className="max-w-3xl mx-auto px-4 py-4">
          <div className="relative flex items-end gap-2 bg-background border border-border px-4 py-3 focus-within:border-primary/50 transition-colors">
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
              onBlur={handleBlur}
              placeholder="ENTER QUERY..."
              rows={1}
              className="flex-1 bg-transparent resize-none outline-none text-xs max-h-32 min-h-[20px] placeholder:text-muted-foreground/50 placeholder:uppercase placeholder:tracking-wider"
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
                className="shrink-0 size-8 p-0"
              >
                <Square data-icon="inline-start" />
              </Button>
            ) : (
              <Button
                type="submit"
                size="sm"
                disabled={!input.trim()}
                className="shrink-0 size-8 p-0"
              >
                <Send data-icon="inline-start" />
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
                  className={`text-[10px] px-2.5 py-1 uppercase tracking-wider font-bold transition-colors border ${
                    provider === p.id
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                >
                  [{p.code}] {p.label}
                </button>
              ))}
            </div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
              Channel: {currentProvider.code}
            </p>
          </div>
        </form>
      </div>
    </div>
  )
}
