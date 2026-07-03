'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Plus, BookOpen, LayoutGrid } from 'lucide-react'
import { NewsletterSignup } from '@/components/newsletter-signup'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
  SidebarTrigger,
} from '@/components/ui/sidebar'

const NAV_ITEMS = [
  { href: '/blog', label: 'Briefings', icon: BookOpen },
  { href: '/explore', label: 'Archives', icon: LayoutGrid },
] as const

function SidebarNav() {
  const pathname = usePathname()

  const isActive = (path: string) => {
    if (path === '/') return pathname === '/'
    return pathname.startsWith(path)
  }

  const handleNewCase = (e: React.MouseEvent) => {
    e.preventDefault()
    window.location.href = '/'
  }

  return (
    <Sidebar>
      <SidebarHeader className="px-3 py-4">
        <Link href="/" onClick={handleNewCase} className="flex items-baseline gap-1">
          <span
            className="type-display text-[17px] uppercase text-ink"
            style={{ fontVariationSettings: '"wdth" 122', fontWeight: 880 }}
          >
            MindPattern
          </span>
          <span className="inline-block size-1.5 rounded-full bg-primary" aria-hidden />
        </Link>
      </SidebarHeader>

      <SidebarSeparator />

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="type-kicker text-ink-faint">
            Operations
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton onClick={handleNewCase} isActive={isActive('/') && !isActive('/blog') && !isActive('/explore')}>
                    <Plus data-icon="inline-start" />
                    <span className="font-mono text-xs uppercase tracking-[0.12em]">New Case</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        <SidebarGroup>
          <SidebarGroupLabel className="type-kicker text-ink-faint">
            File Index
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {NAV_ITEMS.map(({ href, label, icon: Icon }) => (
                <SidebarMenuItem key={href}>
                  <SidebarMenuButton render={<Link href={href} />} isActive={isActive(href)}>
                      <Icon data-icon="inline-start" />
                      <span className="font-mono text-xs uppercase tracking-[0.12em]">{label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="px-3 py-3">
        <NewsletterSignup className="mb-3" />
        <SidebarSeparator />
        <SidebarTrigger className="w-full justify-start gap-2 text-ink-soft mt-2" />
      </SidebarFooter>
    </Sidebar>
  )
}

export { SidebarNav }
