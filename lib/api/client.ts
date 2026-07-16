import { clearStoredToken, getStoredToken } from "@/lib/auth/token"
import { API_BASE_URL } from "@/lib/constants"
import { ApiClientError, type ApiError } from "@/lib/types/errors"

function redirectToLogin() {
  if (typeof window !== "undefined") window.location.assign("/login?reason=session_expired")
}

async function parseError(res: Response): Promise<ApiError> {
  const body = await res.json().catch(() => null)
  if (body && typeof body === "object" && "code" in body) return body as ApiError
  // Raw Spring Security rejections have no `code` field — normalize so every
  // caller can branch on ApiError.code alone (lib/types/errors.ts, rule zero
  // of docs/frontend/09-error-handling.md).
  return {
    code: "UNAUTHENTICATED",
    message: body?.error ?? res.statusText,
    status: res.status,
    timestamp: new Date().toISOString(),
  }
}

// Any 401/403 anywhere clears the session and sends the user back to /login —
// there's no token-refresh flow (BE §2), matching docs/frontend/07-auth-and-permissions.md.
async function send<T>(path: string, init: RequestInit): Promise<T> {
  const token = getStoredToken()
  if (!token) {
    redirectToLogin()
    throw new ApiClientError({
      code: "UNAUTHENTICATED",
      message: "Not signed in",
      status: 401,
      timestamp: new Date().toISOString(),
    })
  }

  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...init.headers,
    },
  })

  if (res.status === 204) return undefined as T

  if (!res.ok) {
    if (res.status === 401 || res.status === 403) {
      clearStoredToken()
      redirectToLogin()
    }
    throw new ApiClientError(await parseError(res))
  }

  return (await res.json()) as T
}

export const apiClient = {
  get: <T>(path: string) => send<T>(path, { method: "GET" }),
  post: <T>(path: string, body?: unknown) =>
    send<T>(path, { method: "POST", body: body !== undefined ? JSON.stringify(body) : undefined }),
  put: <T>(path: string, body?: unknown) =>
    send<T>(path, { method: "PUT", body: body !== undefined ? JSON.stringify(body) : undefined }),
  delete: <T>(path: string) => send<T>(path, { method: "DELETE" }),
}
