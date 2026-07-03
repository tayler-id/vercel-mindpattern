import type { ReactNode } from 'react'
import Link from 'next/link'
import { HeaderNav, BottomTabBar } from '@/components/shell/site-nav'

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-[100dvh] flex-col bg-paper text-ink">
      <a href="#main-content" className="skip-link">
        Skip to content
      </a>

      <header className="pt-safe sticky top-0 z-10 border-b border-ink bg-paper">
        <div className="shrink-header flex items-center gap-8 px-8 py-3 max-sm:px-5">
          <Link
            href="/"
            aria-label="MindPattern home"
            className="text-[20px] uppercase leading-none text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
            style={{ fontVariationSettings: '"wdth" 122', fontWeight: 880, letterSpacing: '-0.01em' }}
          >
            MindPattern
          </Link>
          <HeaderNav />
          <Link
            href="/#subscribe"
            className="ml-auto hidden rounded-full bg-primary px-5 py-2.5 font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-white transition-[transform,filter] duration-(--dur-fast) hover:brightness-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink active:scale-95 sm:inline-block"
          >
            Subscribe
          </Link>
        </div>
      </header>

      <main
        id="main-content"
        tabIndex={-1}
        className="min-h-0 flex-1 pb-[calc(64px+env(safe-area-inset-bottom))] sm:pb-0"
      >
        {children}
      </main>

      <BottomTabBar />
    </div>
  )
}
