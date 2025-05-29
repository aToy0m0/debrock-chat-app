"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Eye, EyeOff, Shield } from "lucide-react"

interface AuthContextType {
  isAuthenticated: boolean
  awsCredentials: {
    accessKeyId: string
    secretAccessKey: string
    region: string
  } | null
  login: (credentials: { accessKeyId: string; secretAccessKey: string; region: string }) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [awsCredentials, setAwsCredentials] = useState<{
    accessKeyId: string
    secretAccessKey: string
    region: string
  } | null>(null)
  const [showPassword, setShowPassword] = useState(false)

  useEffect(() => {
    // ローカルストレージから認証情報を復元（実際のアプリでは暗号化推奨）
    const stored = localStorage.getItem("aws-credentials")
    if (stored) {
      try {
        const credentials = JSON.parse(stored)
        setAwsCredentials(credentials)
        setIsAuthenticated(true)
      } catch (error) {
        console.error("Failed to parse stored credentials")
      }
    }
  }, [])

  const login = (credentials: { accessKeyId: string; secretAccessKey: string; region: string }) => {
    setAwsCredentials(credentials)
    setIsAuthenticated(true)
    localStorage.setItem("aws-credentials", JSON.stringify(credentials))
  }

  const logout = () => {
    setAwsCredentials(null)
    setIsAuthenticated(false)
    localStorage.removeItem("aws-credentials")
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-700 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-2xl border-0 bg-white/80 backdrop-blur-sm dark:bg-slate-800/80">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              AWS Bedrock Chat
            </CardTitle>
            <CardDescription className="text-slate-600 dark:text-slate-300">
              AWS認証情報を入力してください
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={(e) => {
                e.preventDefault()
                const formData = new FormData(e.currentTarget)
                login({
                  accessKeyId: formData.get("accessKeyId") as string,
                  secretAccessKey: formData.get("secretAccessKey") as string,
                  region: formData.get("region") as string,
                })
              }}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label htmlFor="accessKeyId">アクセスキーID</Label>
                <Input
                  id="accessKeyId"
                  name="accessKeyId"
                  type="text"
                  required
                  className="transition-all duration-200 focus:ring-2 focus:ring-blue-500"
                  placeholder="AKIA..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="secretAccessKey">シークレットアクセスキー</Label>
                <div className="relative">
                  <Input
                    id="secretAccessKey"
                    name="secretAccessKey"
                    type={showPassword ? "text" : "password"}
                    required
                    className="pr-10 transition-all duration-200 focus:ring-2 focus:ring-blue-500"
                    placeholder="シークレットキーを入力"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-slate-500" />
                    ) : (
                      <Eye className="h-4 w-4 text-slate-500" />
                    )}
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="region">リージョン</Label>
                <Input
                  id="region"
                  name="region"
                  type="text"
                  required
                  defaultValue="us-east-1"
                  className="transition-all duration-200 focus:ring-2 focus:ring-blue-500"
                  placeholder="us-east-1"
                />
              </div>
              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 transition-all duration-200 transform hover:scale-105"
              >
                ログイン
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, awsCredentials, login, logout }}>{children}</AuthContext.Provider>
  )
}
