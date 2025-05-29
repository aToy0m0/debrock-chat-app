import { type NextRequest, NextResponse } from "next/server"
import { BedrockAgentRuntimeClient, InvokeAgentCommand } from "@aws-sdk/client-bedrock-agent-runtime"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

// AWS認証情報を環境変数から取得
const AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID
const AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY
const AWS_REGION = process.env.AWS_REGION || "us-east-1"
const BEDROCK_AGENT_ID = process.env.BEDROCK_AGENT_ID
const BEDROCK_AGENT_ALIAS_ID = process.env.BEDROCK_AGENT_ALIAS_ID

export async function POST(request: NextRequest) {
  try {
    // セッションを取得して認証確認
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 })
    }

    const { message, history } = await request.json()

    if (!message) {
      return NextResponse.json({ error: "メッセージが必要です" }, { status: 400 })
    }

    // AWS認証情報とエージェント設定が設定されているか確認
    if (!AWS_ACCESS_KEY_ID || !AWS_SECRET_ACCESS_KEY || !BEDROCK_AGENT_ID || !BEDROCK_AGENT_ALIAS_ID) {
      return NextResponse.json({
        response:
          "申し訳ございません。AWS Bedrock エージェントの設定が完了していません。管理者にお問い合わせください。",
      })
    }

    try {
      // AWS Bedrock Agent クライアントを初期化
      const bedrockAgentClient = new BedrockAgentRuntimeClient({
        region: AWS_REGION,
        credentials: {
          accessKeyId: AWS_ACCESS_KEY_ID,
          secretAccessKey: AWS_SECRET_ACCESS_KEY,
        },
      })

      // 会話履歴を構築
      const conversationHistory = history
        .slice(-10) // 最新の10メッセージのみ使用
        .map((msg: any) => ({
          role: msg.role === "user" ? "user" : "agent",
          content: [
            {
              text: msg.content,
            },
          ],
        }))

      // エージェントへのリクエストを構築
      const command = new InvokeAgentCommand({
        agentId: BEDROCK_AGENT_ID,
        agentAliasId: BEDROCK_AGENT_ALIAS_ID,
        sessionId: session.user.id, // ユーザーIDをセッションIDとして使用
        inputText: message,
        // オプション: 会話履歴を含める場合
        sessionState:
          conversationHistory.length > 0
            ? {
                promptSessionAttributes: {
                  messageHistory: JSON.stringify(conversationHistory),
                },
              }
            : undefined,
      })

      // エージェントを呼び出し
      const response = await bedrockAgentClient.send(command)

      // レスポンスを解析
      let aiResponse = ""

      if (response.completion) {
        aiResponse = response.completion
      } else if (response.chunks && response.chunks.length > 0) {
        // チャンクがある場合は結合
        aiResponse = response.chunks
          .map((chunk) => {
            if (chunk.chunk?.bytes) {
              const decoder = new TextDecoder()
              const chunkData = JSON.parse(decoder.decode(chunk.chunk.bytes))
              return chunkData.text || ""
            }
            return ""
          })
          .join("")
      }

      // 引用情報がある場合は追加
      if (response.citations && response.citations.length > 0) {
        const citationsText = response.citations
          .map((citation, index) => {
            return `[${index + 1}] ${citation.retrievedReferences?.[0]?.content?.text || "参照情報"}`
          })
          .join("\n\n")

        if (citationsText) {
          aiResponse += "\n\n**参照情報:**\n" + citationsText
        }
      }

      return NextResponse.json({
        response: aiResponse || "応答を生成できませんでした。",
      })
    } catch (bedrockError) {
      console.error("Bedrock Agent API error:", bedrockError)

      // Bedrockエラーの場合でも、フレンドリーなメッセージを返す
      return NextResponse.json({
        response: "申し訳ございません。現在AIエージェントに接続できません。しばらく時間をおいて再度お試しください。",
      })
    }
  } catch (error) {
    console.error("General API error:", error)
    return NextResponse.json({
      response: "申し訳ございません。予期しないエラーが発生しました。",
    })
  }
}
