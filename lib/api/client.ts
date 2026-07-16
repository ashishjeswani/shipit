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

function requireToken(): string {
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
  return token
}

async function handleResponse<T>(res: Response, as: "json" | "blob"): Promise<T> {
  if (res.status === 204) return undefined as T

  if (!res.ok) {
    if (res.status === 401 || res.status === 403) {
      clearStoredToken()
      redirectToLogin()
    }
    throw new ApiClientError(await parseError(res))
  }

  if (as === "blob") return (await res.blob()) as T
  // Some lifecycle endpoints (e.g. PUT file) return 200 with an empty body.
  const text = await res.text()
  if (!text) return undefined as T
  return JSON.parse(text) as T
}

// Any 401/403 anywhere clears the session and sends the user back to /login —
// there's no token-refresh flow (BE §2), matching docs/frontend/07-auth-and-permissions.md.
async function send<T>(path: string, init: RequestInit): Promise<T> {
  const token = requireToken()
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...init.headers,
    },
  })
  return handleResponse<T>(res, "json")
}

// Multipart uploads must NOT set Content-Type — the browser supplies the
// boundary. Used by Storage upload and POST /api/releases/{id}/requests.
async function sendForm<T>(path: string, method: "POST" | "PUT", form: FormData): Promise<T> {
  const token = requireToken()
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  })
  return handleResponse<T>(res, "json")
}

async function sendBlob(path: string): Promise<Blob> {
  const token = requireToken()
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: "GET",
    headers: { Authorization: `Bearer ${token}` },
  })
  return handleResponse<Blob>(res, "blob")
}

export const apiClient = {
  get: <T>(path: string) => send<T>(path, { method: "GET" }),
  getBlob: (path: string) => sendBlob(path),
  post: <T>(path: string, body?: unknown) =>
    send<T>(path, { method: "POST", body: body !== undefined ? JSON.stringify(body) : undefined }),
  postForm: <T>(path: string, form: FormData) => sendForm<T>(path, "POST", form),
  put: <T>(path: string, body?: unknown) =>
    send<T>(path, { method: "PUT", body: body !== undefined ? JSON.stringify(body) : undefined }),
  putForm: <T>(path: string, form: FormData) => sendForm<T>(path, "PUT", form),
  patch: <T>(path: string, body?: unknown) =>
    send<T>(path, { method: "PATCH", body: body !== undefined ? JSON.stringify(body) : undefined }),
  delete: <T>(path: string) => send<T>(path, { method: "DELETE" }),
}
