import { ChatInterface } from '@/components/chat/chat-interface'
import { Header } from '@/components/header'

export default function ChatPage() {
  return (
    <div className="h-screen flex flex-col">
      <Header />
      <main className="flex-1 overflow-hidden">
        <ChatInterface />
      </main>
    </div>
  )
}
