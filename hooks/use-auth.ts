"use client"

import { useEffect } from "react"

import { auth } from "@/lib/api/auth"
import { normalizeRoles } from "@/lib/auth/normalize-roles"
import { clearStoredToken, getStoredToken, setStoredToken } from "@/lib/auth/token"
import { useAuthStore } from "@/stores/auth-store"
import type { User } from "@/lib/types/api"

// Module-level so concurrent useAuth() callers (header, layout, etc.) share
// one GET /api/auth/me instead of each firing their own on first mount.
let bootstrapPromise: Promise<void> | null = null

function bootstrap(setUser: (user: User) => void, clear: () => void) {
  if (!bootstrapPromise) {
    bootstrapPromise = (async () => {
      if (!getStoredToken()) {
        clear()
        return
      }
      try {
        const me = await auth.me()
        setUser({ id: me.id, username: me.username, name: me.name, roles: normalizeRoles(me.roles) })
      } catch {
        clearStoredToken()
        clear()
      }
    })()
  }
  return bootstrapPromise
}

// Session bootstrap on (app)/layout.tsx mount + login (docs/frontend/07-auth-and-permissions.md).
export function useAuth() {
  const user = useAuthStore((state) => state.user)
  const status = useAuthStore((state) => state.status)
  const setUser = useAuthStore((state) => state.setUser)
  const clear = useAuthStore((state) => state.clear)

  useEffect(() => {
    if (status === "loading") bootstrap(setUser, clear)
  }, [status, setUser, clear])

  async function login(username: string, password: string): Promise<User> {
    const result = await auth.login(username, password)
    setStoredToken(result.token)
    const normalized: User = {
      id: result.user.id,
      username: result.user.username,
      name: result.user.name,
      roles: normalizeRoles(result.user.roles),
    }
    setUser(normalized)
    return normalized
  }

  function logout() {
    clearStoredToken()
    clear()
    bootstrapPromise = null
  }

  return { user, status, login, logout }
}
