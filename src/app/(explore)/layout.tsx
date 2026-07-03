import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar'
import { SidebarNav } from '@/components/sidebar'
import { Separator } from '@/components/ui/separator'

export default function ExploreLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <SidebarNav />
      <SidebarInset>
        <header className="flex items-center gap-2 px-3 py-2 md:hidden border-b border-line bg-paper">
          <SidebarTrigger />
          <Separator orientation="vertical" className="h-4" />
          <span className="type-display text-[15px] uppercase text-ink" style={{ fontVariationSettings: '"wdth" 122', fontWeight: 880 }}>MindPattern</span>
        </header>
        {children}
      </SidebarInset>
    </SidebarProvider>
  )
}
