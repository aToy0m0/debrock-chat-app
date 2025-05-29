"use client"

import type React from "react"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Eye, EyeOff, Shield, Building2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const router = useRouter()
  const { toast } = useToast()

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        toast({
          title: "ログインエラー",
          description: "メールアドレスまたはパスワードが正しくありません",
          variant: "destructive",
        })
        return
      }

      router.push("/")
      router.refresh()
    } catch (error) {
      toast({
        title: "エラーが発生しました",
        description: "ログイン処理中にエラーが発生しました",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleEntraIdLogin = async () => {
    setIsLoading(true)
    try {
      await signIn("azure-ad", { callbackUrl: "/" })
    } catch (error) {
      toast({
        title: "ログインエラー",
        description: "Entra IDログインでエラーが発生しました",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

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
          <CardDescription className="text-slate-600 dark:text-slate-300">ログインしてチャットを開始</CardDescription>
        </CardHeader>

        <Tabs defaultValue="user" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="user">ユーザーログイン</TabsTrigger>
            <TabsTrigger value="admin">管理者ログイン</TabsTrigger>
          </TabsList>

          <TabsContent value="user">
            <CardContent className="space-y-4">
              <div className="text-center text-sm text-slate-600 dark:text-slate-400 mb-4">
                Entra ID（Azure AD）でログイン
              </div>
              <Button
                variant="outline"
                className="w-full border-slate-300 hover:bg-slate-100 dark:border-slate-600 dark:hover:bg-slate-700"
                onClick={handleEntraIdLogin}
                disabled={isLoading}
              >
                <Building2 className="mr-2 h-4 w-4" />
                {isLoading ? "ログイン中..." : "Entra IDでログイン"}
              </Button>
            </CardContent>
          </TabsContent>

          <TabsContent value="admin">
            <CardContent>
              <form onSubmit={handleAdminLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">メールアドレス</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="transition-all duration-200 focus:ring-2 focus:ring-blue-500"
                    placeholder="admin@example.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">パスワード</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="pr-10 transition-all duration-200 focus:ring-2 focus:ring-blue-500"
                      placeholder="パスワードを入力"
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
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 transition-all duration-200"
                >
                  {isLoading ? "ログイン中..." : "管理者としてログイン"}
                </Button>
              </form>
            </CardContent>
          </TabsContent>
        </Tabs>

        <CardFooter className="flex justify-center pt-2">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            ログインすることで、利用規約とプライバシーポリシーに同意したことになります。
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}
