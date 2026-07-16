import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

import { TOKEN_COOKIE_NAME } from "@/lib/auth/token"

// Next.js 16 renamed `middleware.ts`/`middleware()` to `proxy.ts`/`proxy()` —
// this only checks the session cookie's *presence* for redirects; the live
// backend is the actual authority on whether the token is valid
// (docs/frontend/07-auth-and-permissions.md).
export function proxy(request: NextRequest) {
  const hasToken = request.cookies.has(TOKEN_COOKIE_NAME)
  const isAuthRoute = request.nextUrl.pathname.startsWith("/login")

  if (!hasToken && !isAuthRoute) {
    return NextResponse.redirect(new URL("/login", request.url))
  }
  if (hasToken && isAuthRoute) {
    return NextResponse.redirect(new URL("/dashboard", request.url))
  }
  return NextResponse.next()
}

export const config = { matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"] }
