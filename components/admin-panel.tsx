"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, XCircle, AlertCircle, RefreshCw } from "lucide-react"

interface SystemStatus {
  environment: {
    hasAzureClientId: boolean
    hasAzureClientSecret: boolean
    hasAzureTenantId: boolean
    hasAdminEmail: boolean
    hasAdminPassword: boolean
    hasAwsAccessKey: boolean
    hasAwsSecretKey: boolean
    awsRegion: string
    bedrockAgentId: string
    bedrockAgentAliasId: string
    nextAuthUrl: string
    hasNextAuthSecret: boolean
  }
  session: any
  timestamp: string
}

export function AdminPanel() {
  const [status, setStatus] = useState<SystemStatus | null>(null)
  const [loading, setLoading] = useState(false)

  const fetchStatus = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/auth/debug")
      const data = await response.json()
      setStatus(data)
    } catch (error) {
      console.error("ステータス取得エラー:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStatus()
  }, [])

  const StatusIcon = ({ condition }: { condition: boolean }) => {
    return condition ? <CheckCircle className="h-4 w-4 text-green-500" /> : <XCircle className="h-4 w-4 text-red-500" />
  }

  const StatusBadge = ({ condition, label }: { condition: boolean; label: string }) => {
    return (
      <Badge variant={condition ? "default" : "destructive"} className="flex items-center gap-1">
        <StatusIcon condition={condition} />
        {label}
      </Badge>
    )
  }

  if (!status) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>システム状況</CardTitle>
          <CardDescription>読み込み中...</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  const { environment } = status

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>システム設定状況</CardTitle>
            <CardDescription>最終更新: {new Date(status.timestamp).toLocaleString()}</CardDescription>
          </div>
          <Button onClick={fetchStatus} disabled={loading} size="sm">
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            更新
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-medium mb-2">認証設定</h4>
            <div className="grid grid-cols-2 gap-2">
              <StatusBadge condition={environment.hasAzureClientId} label="Azure Client ID" />
              <StatusBadge condition={environment.hasAzureClientSecret} label="Azure Client Secret" />
              <StatusBadge condition={environment.hasAzureTenantId} label="Azure Tenant ID" />
              <StatusBadge condition={environment.hasAdminEmail} label="管理者メール" />
              <StatusBadge condition={environment.hasAdminPassword} label="管理者パスワード" />
              <StatusBadge condition={environment.hasNextAuthSecret} label="NextAuth Secret" />
            </div>
          </div>

          <div>
            <h4 className="font-medium mb-2">AWS Bedrock エージェント設定</h4>
            <div className="grid grid-cols-2 gap-2">
              <StatusBadge condition={environment.hasAwsAccessKey} label="AWS Access Key" />
              <StatusBadge condition={environment.hasAwsSecretKey} label="AWS Secret Key" />
            </div>
            <div className="mt-2 space-y-1 text-sm">
              <p>
                リージョン: <code className="bg-slate-100 px-1 rounded">{environment.awsRegion}</code>
              </p>
              <p>
                エージェントID:{" "}
                <code className="bg-slate-100 px-1 rounded">{environment.bedrockAgentId || "未設定"}</code>
              </p>
              <p>
                エイリアスID:{" "}
                <code className="bg-slate-100 px-1 rounded">{environment.bedrockAgentAliasId || "未設定"}</code>
              </p>
            </div>
          </div>

          <div>
            <h4 className="font-medium mb-2">全体的な状況</h4>
            <div className="flex items-center gap-2">
              {environment.hasAzureClientId && environment.hasAzureClientSecret && environment.hasAzureTenantId ? (
                <Badge className="bg-green-100 text-green-800">
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Entra ID連携: 正常
                </Badge>
              ) : (
                <Badge variant="destructive">
                  <XCircle className="h-4 w-4 mr-1" />
                  Entra ID連携: 設定不完全
                </Badge>
              )}

              {environment.hasAwsAccessKey &&
              environment.hasAwsSecretKey &&
              environment.bedrockAgentId &&
              environment.bedrockAgentAliasId ? (
                <Badge className="bg-green-100 text-green-800">
                  <CheckCircle className="h-4 w-4 mr-1" />
                  AWS Bedrock エージェント: 正常
                </Badge>
              ) : (
                <Badge className="bg-yellow-100 text-yellow-800">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  AWS Bedrock エージェント: 設定不完全
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {status.session && (
        <Card>
          <CardHeader>
            <CardTitle>現在のセッション</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p>
                <strong>ユーザー:</strong> {status.session.user?.name || "不明"}
              </p>
              <p>
                <strong>メール:</strong> {status.session.user?.email || "不明"}
              </p>
              <p>
                <strong>ロール:</strong> {status.session.user?.role || "user"}
              </p>
              <p>
                <strong>有効期限:</strong> {new Date(status.session.expires).toLocaleString()}
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
