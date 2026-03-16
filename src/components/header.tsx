'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ThemeToggle } from './theme-toggle'

export function Header() {
  const pathname = usePathname()

  return (
    <header className="border-b border-border">
      <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3">
          {/* Logo — replace src with your logo.png in /public */}
          <div className="size-8 rounded-full overflow-hidden bg-foreground text-background flex items-center justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo.png"
              alt="MindPattern"
              className="size-8 rounded-full"
              onError={(e) => {
                // Fallback if logo.png doesn't exist yet
                const el = e.currentTarget
                el.style.display = 'none'
                el.parentElement!.innerHTML = '<span style="font-size:10px;font-weight:700;letter-spacing:0.05em">MP</span>'
              }}
            />
          </div>
          <span className="font-mono text-sm font-bold tracking-wide">
            MINDPATTERN
          </span>
        </Link>

        <div className="flex items-center gap-1">
          <Link
            href="/chat"
            className={`px-3 py-1.5 text-xs font-mono font-semibold tracking-wide border transition-colors ${
              pathname === '/chat'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            ASK AGENT
          </Link>
          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}
