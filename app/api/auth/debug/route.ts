import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    // 環境変数の確認（機密情報は除く）
    const envCheck = {
      hasAzureClientId: !!process.env.AZURE_AD_CLIENT_ID,
      hasAzureClientSecret: !!process.env.AZURE_AD_CLIENT_SECRET,
      hasAzureTenantId: !!process.env.AZURE_AD_TENANT_ID,
      hasAdminEmail: !!process.env.ADMIN_EMAIL,
      hasAdminPassword: !!process.env.ADMIN_PASSWORD,
      hasAwsAccessKey: !!process.env.AWS_ACCESS_KEY_ID,
      hasAwsSecretKey: !!process.env.AWS_SECRET_ACCESS_KEY,
      awsRegion: process.env.AWS_REGION || "未設定",
      bedrockAgentId: process.env.BEDROCK_AGENT_ID || "未設定",
      bedrockAgentAliasId: process.env.BEDROCK_AGENT_ALIAS_ID || "未設定",
      nextAuthUrl: process.env.NEXTAUTH_URL || "未設定",
      hasNextAuthSecret: !!process.env.NEXTAUTH_SECRET,
    }

    return NextResponse.json({
      session: session
        ? {
            user: session.user,
            expires: session.expires,
          }
        : null,
      environment: envCheck,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    return NextResponse.json(
      {
        error: "デバッグ情報の取得に失敗しました",
        details: error instanceof Error ? error.message : "不明なエラー",
      },
      { status: 500 },
    )
  }
}
