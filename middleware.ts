import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getToken } from "next-auth/jwt"

export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request })

  // ログインページへのアクセスで、すでに認証済みの場合はホームにリダイレクト
  if (request.nextUrl.pathname === "/login") {
    if (token) {
      return NextResponse.redirect(new URL("/", request.url))
    }
    return NextResponse.next()
  }

  // 認証が必要なページへのアクセスで、未認証の場合はログインページにリダイレクト
  if (!token) {
    const loginUrl = new URL("/login", request.url)
    loginUrl.searchParams.set("callbackUrl", request.nextUrl.pathname)
    return NextResponse.redirect(loginUrl)
  }

  // 管理者専用ページへのアクセスで、管理者でない場合はホームにリダイレクト
  if (request.nextUrl.pathname.startsWith("/admin") && token.role !== "admin") {
    return NextResponse.redirect(new URL("/", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/login", "/", "/admin/:path*"],
}
