'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Plus, BookOpen, LayoutGrid, PanelLeftClose } from 'lucide-react'
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
  useSidebar,
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

  return (
    <Sidebar>
      <SidebarHeader className="px-3 py-4">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex items-center justify-center size-7 border border-primary bg-primary/10">
            <span className="text-primary text-xs font-bold">MP</span>
          </div>
          <span className="text-xs font-bold uppercase tracking-[0.15em] text-foreground">
            MindPattern
          </span>
        </Link>
      </SidebarHeader>

      <SidebarSeparator />

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-bold">
            Operations
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton render={<Link href="/" />} isActive={isActive('/') && !isActive('/blog') && !isActive('/explore')}>
                    <Plus data-icon="inline-start" />
                    <span className="text-xs uppercase tracking-wider">New Case</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-bold">
            File Index
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {NAV_ITEMS.map(({ href, label, icon: Icon }) => (
                <SidebarMenuItem key={href}>
                  <SidebarMenuButton render={<Link href={href} />} isActive={isActive(href)}>
                      <Icon data-icon="inline-start" />
                      <span className="text-xs uppercase tracking-wider">{label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="px-3 py-3">
        <SidebarTrigger className="w-full justify-start gap-2 text-xs uppercase tracking-wider text-muted-foreground" />
      </SidebarFooter>
    </Sidebar>
  )
}

export { SidebarNav }
