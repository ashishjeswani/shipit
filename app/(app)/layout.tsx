"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

import { AppHeader } from "@/components/layout/app-header"
import { useAuth } from "@/hooks/use-auth"

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { status } = useAuth()
  const router = useRouter()

  useEffect(() => {
    // Belt-and-suspenders: proxy.ts already redirects a cookie-less visitor
    // before this ever renders — this only covers a stale/invalid cookie
    // that GET /api/auth/me rejected (docs/frontend/07-auth-and-permissions.md).
    if (status === "unauthenticated") router.replace("/login")
  }, [status, router])

  if (status !== "authenticated") {
    return (
      <div className="flex min-h-svh items-center justify-center text-sm text-muted-foreground">
        Loading…
      </div>
    )
  }

  return (
    <div className="flex min-h-svh flex-col">
      <AppHeader />
      <main className="flex-1 p-6">{children}</main>
    </div>
  )
}
