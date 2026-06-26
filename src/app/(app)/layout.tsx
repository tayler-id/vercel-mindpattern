import type { ReactNode } from 'react'
import Link from 'next/link'
import { HeaderNav, BottomTabBar } from '@/components/shell/site-nav'

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-[100dvh] flex-col bg-paper text-ink">
      <a href="#main-content" className="skip-link">
        Skip to content
      </a>

      <header className="pt-safe sticky top-0 z-30 flex items-center gap-4 border-b border-line bg-paper/85 px-5 backdrop-blur-md">
        <div className="flex h-[54px] items-center gap-4">
          <Link
            href="/"
            className="font-mono text-sm font-bold tracking-[-0.02em] text-ink"
          >
            <span className="text-primary">MIND</span>PATTERN
          </Link>
          <HeaderNav />
        </div>
        <Link
          href="/#subscribe"
          className="ml-auto hidden rounded-lg bg-primary px-3.5 py-2 text-[0.8125rem] font-semibold text-primary-foreground transition-[filter] hover:brightness-105 sm:inline-block"
        >
          Subscribe
        </Link>
      </header>

      <main id="main-content" tabIndex={-1} className="min-h-0 flex-1 pb-[calc(58px+env(safe-area-inset-bottom))] sm:pb-0">
        {children}
      </main>

      <BottomTabBar />
    </div>
  )
}
