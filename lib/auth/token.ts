// Non-httpOnly, SameSite=Lax cookie — JS must be able to read it for the
// Authorization header on every fetch (docs/frontend/07-auth-and-permissions.md).
// proxy.ts (Next 16's middleware) only checks this cookie's *presence* for
// route gating; the live backend is the actual authority on validity.
export const TOKEN_COOKIE_NAME = "shipit_token"

export function getStoredToken(): string | null {
  if (typeof document === "undefined") return null
  const match = document.cookie.match(new RegExp(`(?:^|; )${TOKEN_COOKIE_NAME}=([^;]*)`))
  return match ? decodeURIComponent(match[1]) : null
}

export function setStoredToken(token: string) {
  if (typeof document === "undefined") return
  document.cookie = `${TOKEN_COOKIE_NAME}=${encodeURIComponent(token)}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`
}

export function clearStoredToken() {
  if (typeof document === "undefined") return
  document.cookie = `${TOKEN_COOKIE_NAME}=; path=/; max-age=0; SameSite=Lax`
}
