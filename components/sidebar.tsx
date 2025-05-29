"use client"

import { useState } from "react"
import { signOut } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useThreads } from "@/components/thread-provider"
import { Plus, Pin, Trash2, LogOut, MessageSquare, Settings, UserIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface SidebarProps {
  user: {
    name?: string | null
    email?: string | null
    image?: string | null
    role?: string
  }
}

export function Sidebar({ user }: SidebarProps) {
  const { threads, currentThread, createThread, selectThread, deleteThread, togglePinThread } = useThreads()
  const [isCollapsed, setIsCollapsed] = useState(false)

  const sortedThreads = [...threads].sort((a, b) => {
    if (a.pinned && !b.pinned) return -1
    if (!a.pinned && b.pinned) return 1
    return b.createdAt.getTime() - a.createdAt.getTime()
  })

  const isAdmin = user?.role === "admin"

  return (
    <div
      className={cn(
        "flex flex-col bg-white/80 backdrop-blur-sm border-r border-slate-200/50 dark:bg-slate-800/80 dark:border-slate-700/50 transition-all duration-300",
        isCollapsed ? "w-16" : "w-80",
      )}
    >
      {/* ヘッダー */}
      <div className="p-4 border-b border-slate-200/50 dark:border-slate-700/50">
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <h2 className="text-lg font-semibold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              チャット履歴
            </h2>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hover:bg-slate-100 dark:hover:bg-slate-700"
          >
            <MessageSquare className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* 新しいチャットボタン */}
      <div className="p-4">
        <Button
          onClick={createThread}
          className={cn(
            "bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 transition-all duration-200",
            isCollapsed ? "w-8 h-8 p-0" : "w-full",
          )}
        >
          <Plus className="h-4 w-4" />
          {!isCollapsed && <span className="ml-2">新しいチャット</span>}
        </Button>
      </div>

      {/* スレッドリスト */}
      <ScrollArea className="flex-1 px-2">
        <div className="space-y-2">
          {sortedThreads.map((thread) => (
            <div
              key={thread.id}
              className={cn(
                "group relative rounded-lg border transition-all duration-200 hover:shadow-md",
                currentThread?.id === thread.id
                  ? "bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200 dark:from-blue-900/20 dark:to-purple-900/20 dark:border-blue-700"
                  : "bg-white/50 border-slate-200/50 hover:bg-slate-50 dark:bg-slate-800/50 dark:border-slate-700/50 dark:hover:bg-slate-700/50",
              )}
            >
              <Button
                variant="ghost"
                onClick={() => selectThread(thread.id)}
                className={cn("w-full justify-start p-3 h-auto text-left hover:bg-transparent", isCollapsed && "p-2")}
              >
                <div className="flex items-start space-x-2 w-full">
                  {thread.pinned && <Pin className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />}
                  {!isCollapsed && (
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{thread.title}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{thread.messages.length} メッセージ</p>
                    </div>
                  )}
                </div>
              </Button>

              {!isCollapsed && (
                <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex space-x-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      togglePinThread(thread.id)
                    }}
                    className="h-6 w-6 p-0 hover:bg-blue-100 dark:hover:bg-blue-900/20"
                  >
                    <Pin className={cn("h-3 w-3", thread.pinned ? "text-blue-500" : "text-slate-400")} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      deleteThread(thread.id)
                    }}
                    className="h-6 w-6 p-0 hover:bg-red-100 dark:hover:bg-red-900/20"
                  >
                    <Trash2 className="h-3 w-3 text-slate-400 hover:text-red-500" />
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      </ScrollArea>

      {/* フッター */}
      <div className="p-4 border-t border-slate-200/50 dark:border-slate-700/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Avatar className="h-8 w-8">
              <AvatarImage src={user?.image || ""} alt={user?.name || "ユーザー"} />
              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                {user?.name?.[0] || "U"}
              </AvatarFallback>
            </Avatar>
            {!isCollapsed && (
              <div className="flex flex-col">
                <p className="text-sm font-medium truncate max-w-[140px]">{user?.name || "ユーザー"}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[140px]">
                  {isAdmin ? "管理者" : "ユーザー"}
                </p>
              </div>
            )}
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <Settings className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>アカウント</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {isAdmin && (
                <DropdownMenuItem>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>管理設定</span>
                </DropdownMenuItem>
              )}
              <DropdownMenuItem>
                <UserIcon className="mr-2 h-4 w-4" />
                <span>プロフィール</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => signOut({ callbackUrl: "/login" })}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>ログアウト</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  )
}
