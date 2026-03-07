'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { Button } from '@/components/ui/button'

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const pathname = usePathname()

  const isActive = (path: string) => {
    if (path === '/') return pathname === '/'
    return pathname.startsWith(path)
  }

  return (
    <aside className={`${collapsed ? 'w-16' : 'w-64'} bg-sidebar border-r border-sidebar-border flex flex-col transition-all duration-200`}>
      {/* Header */}
      <div className="p-4 border-b border-sidebar-border flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center shrink-0">
          <span className="text-primary text-sm font-bold">M</span>
        </div>
        {!collapsed && <span className="font-semibold text-sm">MindPattern</span>}
      </div>

      {/* New Chat */}
      <div className="p-3">
        <Link href="/">
          <Button variant={isActive('/') && !isActive('/blog') && !isActive('/explore') ? 'secondary' : 'outline'} className={`${collapsed ? 'w-10 px-0' : 'w-full'} justify-start gap-2`}>
            <PlusIcon />
            {!collapsed && 'New Chat'}
          </Button>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 space-y-1">
        {/* Chat history will go here in a later task */}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-sidebar-border space-y-1">
        <Link href="/blog">
          <Button variant={isActive('/blog') ? 'secondary' : 'ghost'} className={`${collapsed ? 'w-10 px-0' : 'w-full'} justify-start gap-2 text-muted-foreground`}>
            <BookIcon />
            {!collapsed && 'Blog'}
          </Button>
        </Link>
        <Link href="/explore">
          <Button variant={isActive('/explore') ? 'secondary' : 'ghost'} className={`${collapsed ? 'w-10 px-0' : 'w-full'} justify-start gap-2 text-muted-foreground`}>
            <GridIcon />
            {!collapsed && 'Explore'}
          </Button>
        </Link>
        <Button
          variant="ghost"
          className={`${collapsed ? 'w-10 px-0' : 'w-full'} justify-start gap-2 text-muted-foreground`}
          onClick={() => setCollapsed(!collapsed)}
        >
          <ChevronIcon collapsed={collapsed} />
          {!collapsed && 'Collapse'}
        </Button>
      </div>
    </aside>
  )
}

function PlusIcon() {
  return <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
}

function BookIcon() {
  return <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2 3h4.5a2 2 0 012 2v8a1.5 1.5 0 00-1.5-1.5H2V3zM14 3H9.5a2 2 0 00-2 2v8A1.5 1.5 0 019 11.5H14V3z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
}

function GridIcon() {
  return <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="2" y="2" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.5"/><rect x="9" y="2" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.5"/><rect x="2" y="9" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.5"/><rect x="9" y="9" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.5"/></svg>
}

function ChevronIcon({ collapsed }: { collapsed: boolean }) {
  return <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className={`transition-transform ${collapsed ? 'rotate-180' : ''}`}><path d="M10 12L6 8l4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
}
