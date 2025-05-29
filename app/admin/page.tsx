import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { AdminPanel } from "@/components/admin-panel"

export default async function AdminPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/login")
  }

  if (session.user.role !== "admin") {
    redirect("/")
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          管理者ダッシュボード
        </h1>
        <p className="text-slate-600 dark:text-slate-400 mt-2">システムの設定状況と動作状態を確認できます。</p>
      </div>
      <AdminPanel />
    </div>
  )
}
