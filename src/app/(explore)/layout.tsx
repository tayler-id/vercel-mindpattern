import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar'
import { SidebarNav } from '@/components/sidebar'
import { Separator } from '@/components/ui/separator'

export default function ExploreLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <SidebarNav />
      <SidebarInset>
        <header className="flex items-center gap-2 px-3 py-2 md:hidden border-b border-border">
          <SidebarTrigger />
          <Separator orientation="vertical" className="h-4" />
          <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">MindPattern</span>
        </header>
        {children}
      </SidebarInset>
    </SidebarProvider>
  )
}
