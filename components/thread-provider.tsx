"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
}

interface Thread {
  id: string
  title: string
  messages: Message[]
  createdAt: Date
  pinned: boolean
}

interface ThreadContextType {
  threads: Thread[]
  currentThread: Thread | null
  createThread: () => string
  selectThread: (threadId: string) => void
  deleteThread: (threadId: string) => void
  togglePinThread: (threadId: string) => void
  addMessage: (message: Omit<Message, "id" | "timestamp">) => void
  updateThreadTitle: (threadId: string, title: string) => void
}

const ThreadContext = createContext<ThreadContextType | undefined>(undefined)

export function useThreads() {
  const context = useContext(ThreadContext)
  if (context === undefined) {
    throw new Error("useThreads must be used within a ThreadProvider")
  }
  return context
}

interface ThreadProviderProps {
  children: ReactNode
}

export function ThreadProvider({ children }: ThreadProviderProps) {
  const [threads, setThreads] = useState<Thread[]>([])
  const [currentThread, setCurrentThread] = useState<Thread | null>(null)

  useEffect(() => {
    // ローカルストレージからスレッドを復元
    const stored = localStorage.getItem("chat-threads")
    if (stored) {
      try {
        const parsedThreads = JSON.parse(stored).map((thread: any) => ({
          ...thread,
          createdAt: new Date(thread.createdAt),
          messages: thread.messages.map((msg: any) => ({
            ...msg,
            timestamp: new Date(msg.timestamp),
          })),
        }))
        setThreads(parsedThreads)
        if (parsedThreads.length > 0) {
          setCurrentThread(parsedThreads[0])
        }
      } catch (error) {
        console.error("Failed to parse stored threads")
      }
    }
  }, [])

  useEffect(() => {
    // スレッドをローカルストレージに保存
    localStorage.setItem("chat-threads", JSON.stringify(threads))
  }, [threads])

  const createThread = () => {
    const newThread: Thread = {
      id: crypto.randomUUID(),
      title: `新しいチャット ${threads.length + 1}`,
      messages: [],
      createdAt: new Date(),
      pinned: false,
    }
    setThreads((prev) => [newThread, ...prev])
    setCurrentThread(newThread)
    return newThread.id
  }

  const selectThread = (threadId: string) => {
    const thread = threads.find((t) => t.id === threadId)
    if (thread) {
      setCurrentThread(thread)
    }
  }

  const deleteThread = (threadId: string) => {
    setThreads((prev) => prev.filter((t) => t.id !== threadId))
    if (currentThread?.id === threadId) {
      const remainingThreads = threads.filter((t) => t.id !== threadId)
      setCurrentThread(remainingThreads.length > 0 ? remainingThreads[0] : null)
    }
  }

  const togglePinThread = (threadId: string) => {
    setThreads((prev) =>
      prev.map((thread) => (thread.id === threadId ? { ...thread, pinned: !thread.pinned } : thread)),
    )
  }

  const addMessage = (message: Omit<Message, "id" | "timestamp">) => {
    if (!currentThread) return

    const newMessage: Message = {
      ...message,
      id: crypto.randomUUID(),
      timestamp: new Date(),
    }

    setThreads((prev) =>
      prev.map((thread) =>
        thread.id === currentThread.id ? { ...thread, messages: [...thread.messages, newMessage] } : thread,
      ),
    )

    setCurrentThread((prev) =>
      prev
        ? {
            ...prev,
            messages: [...prev.messages, newMessage],
          }
        : null,
    )

    // 最初のメッセージの場合、タイトルを更新
    if (currentThread.messages.length === 0 && message.role === "user") {
      const title = message.content.length > 30 ? message.content.substring(0, 30) + "..." : message.content
      updateThreadTitle(currentThread.id, title)
    }
  }

  const updateThreadTitle = (threadId: string, title: string) => {
    setThreads((prev) => prev.map((thread) => (thread.id === threadId ? { ...thread, title } : thread)))
    if (currentThread?.id === threadId) {
      setCurrentThread((prev) => (prev ? { ...prev, title } : null))
    }
  }

  return (
    <ThreadContext.Provider
      value={{
        threads,
        currentThread,
        createThread,
        selectThread,
        deleteThread,
        togglePinThread,
        addMessage,
        updateThreadTitle,
      }}
    >
      {children}
    </ThreadContext.Provider>
  )
}
