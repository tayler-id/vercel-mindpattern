import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import { SidebarNav } from '@/components/sidebar'

export default function ChatLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <SidebarNav />
      <SidebarInset>{children}</SidebarInset>
    </SidebarProvider>
  )
}
