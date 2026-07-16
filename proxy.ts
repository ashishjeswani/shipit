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

// firebase-messaging-sw.js must be reachable without a session cookie —
// Firebase registers it under /firebase-cloud-messaging-push-scope, and a
// 307 → /login leaves the worker stuck installing until the 10s timeout
// (messaging/failed-service-worker-registration).
export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|firebase-messaging-sw\\.js).*)",
  ],
}
