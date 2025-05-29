import type { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import AzureADProvider from "next-auth/providers/azure-ad"

// 本番環境では実際のデータベースを使用すること
const ADMIN_USERS = [
  {
    id: "1",
    name: "管理者",
    email: process.env.ADMIN_EMAIL || "admin@example.com",
    // 本番環境ではハッシュ化されたパスワードを使用
    password: process.env.ADMIN_PASSWORD || "adminpassword",
    role: "admin",
  },
]

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "管理者ログイン",
      credentials: {
        email: { label: "メールアドレス", type: "email" },
        password: { label: "パスワード", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const user = ADMIN_USERS.find((user) => user.email === credentials.email)
        if (!user) {
          return null
        }

        // 本番環境ではbcryptなどでハッシュ比較を行う
        // const passwordMatch = await compare(credentials.password, user.password)
        const passwordMatch = credentials.password === user.password

        if (!passwordMatch) {
          return null
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        }
      },
    }),
    AzureADProvider({
      clientId: process.env.AZURE_AD_CLIENT_ID || "",
      clientSecret: process.env.AZURE_AD_CLIENT_SECRET || "",
      tenantId: process.env.AZURE_AD_TENANT_ID || "",
    }),
  ],
  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        token.role = user.role || "user"
      }

      // Azure ADからのログインの場合、ユーザーロールを設定
      if (account?.provider === "azure-ad") {
        token.role = "user"
      }

      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub || ""
        session.user.role = token.role as string
      }
      return session
    },
  },
}
