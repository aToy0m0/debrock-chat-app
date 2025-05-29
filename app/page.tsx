import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { ChatInterface } from "@/components/chat-interface"
import { Sidebar } from "@/components/sidebar"
import { ThreadProvider } from "@/components/thread-provider"

export default async function Home() {
  // セッションを取得し、未認証の場合はログインページにリダイレクト
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/login")
  }

  return (
    <ThreadProvider>
      <div className="flex h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        <Sidebar user={session.user} />
        <ChatInterface />
      </div>
    </ThreadProvider>
  )
}
