import { apiClient } from "@/lib/api/client"
import { API_BASE_URL } from "@/lib/constants"
import { ApiClientError, type ApiError } from "@/lib/types/errors"

export interface AuthProfile {
  id: number
  username: string
  name: string
  roles: string[]
}

export interface AuthResult {
  token: string
  user: AuthProfile
}

// POST /api/auth/login (BE §2) — deliberately bypasses lib/api/client.ts:
// there's no token yet to attach to the request.
async function login(username: string, password: string): Promise<AuthResult> {
  const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  })
  const data = await res.json()
  if (!res.ok) throw new ApiClientError(data as ApiError)
  return data as AuthResult
}

export const auth = {
  login,
  // GET /api/auth/me — rehydrates the session on app load from the stored token.
  me: () => apiClient.get<AuthProfile>("/api/auth/me"),
}
