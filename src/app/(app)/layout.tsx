import type { ReactNode } from 'react'
import Link from 'next/link'
import { HeaderNav, BottomTabBar } from '@/components/shell/site-nav'

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-[100dvh] flex-col bg-paper text-ink">
      <a href="#main-content" className="skip-link">
        Skip to content
      </a>

      <header className="pt-safe sticky top-0 z-30 bg-paper">
        <div className="flex h-[54px] items-center gap-4 px-5">
          <Link
            href="/"
            className="type-display text-lg font-[640] text-ink"
          >
            <span className="text-primary">MIND</span>PATTERN
          </Link>
          <HeaderNav />
          <Link
            href="/#subscribe"
            className="type-kicker ml-auto hidden bg-primary px-4 py-2 text-primary-foreground transition-transform hover:brightness-105 active:scale-95 sm:inline-block"
          >
            Subscribe
          </Link>
        </div>
        <div className="rule-scotch" aria-hidden />
      </header>

      <main id="main-content" tabIndex={-1} className="min-h-0 flex-1 pb-[calc(58px+env(safe-area-inset-bottom))] sm:pb-0">
        {children}
      </main>

      <BottomTabBar />
    </div>
  )
}
