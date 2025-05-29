"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useThreads } from "@/components/thread-provider"
import { Send, Bot, User, Loader2, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { Alert, AlertDescription } from "@/components/ui/alert"
import ReactMarkdown from "react-markdown"

export function ChatInterface() {
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [systemStatus, setSystemStatus] = useState<"ready" | "warning" | "error">("ready")
  const { currentThread, addMessage, createThread } = useThreads()
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    // 新しいメッセージが追加されたときに自動スクロール
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight
    }
  }, [currentThread?.messages])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMessage = input.trim()
    setInput("")
    setIsLoading(true)
    setSystemStatus("ready")

    // スレッドが存在しない場合は作成
    if (!currentThread) {
      createThread()
    }

    // ユーザーメッセージを追加
    addMessage({ role: "user", content: userMessage })

    try {
      // AWS Bedrockにリクエストを送信
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: userMessage,
          history: currentThread?.messages || [],
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()

      // エラーメッセージかどうかを判定
      if (
        data.response.includes("AWS Bedrockの設定が完了していません") ||
        data.response.includes("AIサービスに接続できません")
      ) {
        setSystemStatus("warning")
      }

      // AIメッセージを追加
      addMessage({ role: "assistant", content: data.response })
    } catch (error) {
      console.error("Error:", error)
      setSystemStatus("error")
      addMessage({
        role: "assistant",
        content: "申し訳ございません。通信エラーが発生しました。ネットワーク接続を確認して再度お試しください。",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  return (
    <div className="flex-1 flex flex-col">
      {/* システム状態の表示 */}
      {systemStatus === "warning" && (
        <Alert className="m-4 border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-900/20">
          <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
          <AlertDescription className="text-yellow-800 dark:text-yellow-200">
            AWS Bedrock エージェントの設定が完了していません。基本的な応答のみ利用可能です。
          </AlertDescription>
        </Alert>
      )}

      {systemStatus === "error" && (
        <Alert className="m-4 border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20">
          <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
          <AlertDescription className="text-red-800 dark:text-red-200">
            システムエラーが発生しています。管理者にお問い合わせください。
          </AlertDescription>
        </Alert>
      )}

      {/* チャットエリア */}
      <ScrollArea className="flex-1 p-6" ref={scrollAreaRef}>
        {!currentThread || currentThread.messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 mx-auto bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <Bot className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-slate-700 dark:text-slate-300">AWS Bedrock エージェント</h3>
              <p className="text-slate-500 dark:text-slate-400 max-w-md">
                何でもお聞きください。AWS Bedrockエージェントがお答えします。
              </p>
              <div className="text-xs text-slate-400 dark:text-slate-500 space-y-1">
                <p>💡 ヒント: Enterで送信、Shift+Enterで改行</p>
                <p>🔧 システムが設定中の場合でも、基本的な会話は可能です</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6 max-w-4xl mx-auto">
            {currentThread.messages.map((message) => (
              <div
                key={message.id}
                className={cn("flex items-start space-x-4", message.role === "user" ? "justify-end" : "justify-start")}
              >
                {message.role === "assistant" && (
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                )}

                <div
                  className={cn(
                    "max-w-[70%] rounded-2xl px-4 py-3 shadow-sm",
                    message.role === "user"
                      ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white"
                      : "bg-white/80 backdrop-blur-sm border border-slate-200/50 dark:bg-slate-800/80 dark:border-slate-700/50",
                  )}
                >
                  {message.role === "user" ? (
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                  ) : (
                    <div className="text-sm leading-relaxed prose dark:prose-invert max-w-none">
                      <ReactMarkdown>{message.content}</ReactMarkdown>
                    </div>
                  )}
                  <p
                    className={cn(
                      "text-xs mt-2 opacity-70",
                      message.role === "user" ? "text-blue-100" : "text-slate-500 dark:text-slate-400",
                    )}
                  >
                    {message.timestamp.toLocaleTimeString()}
                  </p>
                </div>

                {message.role === "user" && (
                  <div className="w-8 h-8 bg-slate-200 dark:bg-slate-700 rounded-full flex items-center justify-center flex-shrink-0">
                    <User className="w-4 h-4 text-slate-600 dark:text-slate-300" />
                  </div>
                )}
              </div>
            ))}

            {isLoading && (
              <div className="flex items-start space-x-4">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <div className="bg-white/80 backdrop-blur-sm border border-slate-200/50 dark:bg-slate-800/80 dark:border-slate-700/50 rounded-2xl px-4 py-3 shadow-sm">
                  <div className="flex items-center space-x-2">
                    <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                    <span className="text-sm text-slate-600 dark:text-slate-400">考え中...</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </ScrollArea>

      {/* 入力エリア */}
      <div className="border-t border-slate-200/50 dark:border-slate-700/50 bg-white/80 backdrop-blur-sm dark:bg-slate-800/80 p-6">
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
          <div className="relative">
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="メッセージを入力してください..."
              className="min-h-[60px] max-h-[200px] pr-12 resize-none border-slate-200/50 focus:border-blue-300 focus:ring-2 focus:ring-blue-200 dark:border-slate-700/50 dark:focus:border-blue-600 dark:focus:ring-blue-800/20"
              disabled={isLoading}
            />
            <Button
              type="submit"
              size="sm"
              disabled={!input.trim() || isLoading}
              className="absolute right-2 bottom-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 transition-all duration-200"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </Button>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 text-center">Enterで送信、Shift+Enterで改行</p>
        </form>
      </div>
    </div>
  )
}
