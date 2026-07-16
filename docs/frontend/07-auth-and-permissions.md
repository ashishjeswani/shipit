# 07 — Auth & Permissions

## Token storage decision

BE §0/§2 issues a bearer token that FE must attach to **two** different transports:
1. `Authorization: Bearer <token>` header on every REST `fetch`.
2. The STOMP `CONNECT` frame's `Authorization` header (BE §8 transport) — set client-side when constructing the STOMP client, not sent as an HTTP header at all.

Both requirements mean **JavaScript must be able to read the token** — an `httpOnly` cookie is off the table (that's the standard advice for token storage, but it doesn't fit this contract; noting the tradeoff explicitly rather than silently picking the less secure option).

**Decision:** store the token in a non-`httpOnly`, `SameSite=Lax` cookie named `shipit_token` (helper: `lib/auth/token.ts`), not `localStorage`. Rationale:
- Same XSS exposure as `localStorage` (both are JS-readable) — no security regression either way.
- But a cookie is sent automatically on the initial document request, which means `middleware.ts` (running on the Edge, before any client JS executes) can check for its **presence** and redirect logged-out visitors before the protected page ever renders — `localStorage` is invisible to middleware entirely, which would mean either shipping the protected shell to logged-out users (bad) or adding a client-side redirect flash (worse UX).
- Middleware only checks *presence*, never validates the token's signature/expiry — that stays entirely the BE's job on every request. A stale/invalid cookie still results in a `401` from the BE, handled per below.

**Explicitly out of scope for this MVP:** rotating to an `httpOnly` cookie + BFF-proxy pattern (where a Next.js route handler holds the real token server-side and the browser never sees it). That's the right answer for a real production rollout and is called out here so it isn't forgotten — it requires the WS connection to also proxy through the BFF (a Next.js WebSocket proxy or moving the STOMP client server-side), which is a larger change than this pass's scope.

## Session bootstrap

1. On `(app)/layout.tsx` mount, `useAuth()` reads the cookie; if absent, middleware would already have redirected, so this is just the belt-and-suspenders client check.
2. If present, call `GET /api/auth/me`. On success, populate `auth-store`. On `401`, clear the cookie and redirect to `/login`.
3. Only after `auth-store.status === "authenticated"` does `(app)/layout.tsx` mount the realtime provider (STOMP connect requires the token).

## `401` handling (global)

`lib/api/client.ts` treats **any** `401` response, from any endpoint, the same way: clear the token cookie, clear `auth-store`, redirect to `/login?reason=session_expired`. No retry, no silent refresh (BE §2 has no refresh flow — see [00-overview.md](00-overview.md) assumption 2). The login page reads `reason` to show "Your session expired, please log in again" instead of a generic form.

## `middleware.ts`

```ts
export function middleware(request: NextRequest) {
  const hasToken = request.cookies.has("shipit_token")
  const isAuthRoute = request.nextUrl.pathname.startsWith("/login")

  if (!hasToken && !isAuthRoute) {
    return NextResponse.redirect(new URL("/login", request.url))
  }
  if (hasToken && isAuthRoute) {
    return NextResponse.redirect(new URL("/dashboard", request.url))
  }
  return NextResponse.next()
}

// Also exclude firebase-messaging-sw.js — auth redirects break FCM SW install
// (messaging/failed-service-worker-registration / 10s timeout).
export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|firebase-messaging-sw\\.js).*)"],
}
```

## Capability guards (`lib/auth/capabilities.ts`)

Mirrors BE §9's permissions matrix as pure functions taking `(user, resource)` — **never** an inline `user.roles.includes("APPROVER")` scattered through components. This is UX-only convenience (hide buttons that would 403); the BE is the actual enforcement point (BE §0: "every permission check is a capability check... write your auth guards that way from day one" applies to FE too, for the same reason — a dual-role user's own request must never show review controls, full stop).

```ts
export function hasRole(user: User | null, role: Role): boolean {
  return !!user?.roles.includes(role)
}

export function isOwner(user: User | null, request: Pick<DeploymentRequestDetail, "owner">): boolean {
  return user?.id === request.owner.id
}

// Mirrors BE §9 "Any review action on own request" — the one rule that beats everything else.
export function canReview(user: User | null, request: DeploymentRequestDetail): boolean {
  if (!user || isOwner(user, request)) return false
  if (!hasRole(user, "APPROVER")) return false
  if (request.status !== "PENDING_APPROVAL") return false
  return canOpenRequest(user, request)
}

// Mirrors BE §4 locked semantics: null assignedReviewer = any approver; else only that reviewer (or the owner).
export function canOpenRequest(user: User | null, request: Pick<DeploymentRequestDetail, "owner" | "assignedReviewer">): boolean {
  if (!user) return false
  if (isOwner(user, request)) return true
  if (!hasRole(user, "APPROVER")) return false
  return request.assignedReviewer === null || request.assignedReviewer.id === user.id
}

export function canCreateRelease(user: User | null): boolean {
  return hasRole(user, "APPROVER")
}

export function canCreateRequest(user: User | null, release: Pick<Release, "status">): boolean {
  return hasRole(user, "DEVELOPER") && release.status === "OPEN"
}

export function canEditRequest(user: User | null, request: Pick<DeploymentRequestDetail, "owner" | "status">): boolean {
  return isOwner(user, request) && (request.status === "DRAFT" || request.status === "CHANGES_REQUESTED")
}
```

`<RoleGate role="APPROVER">` (`components/common/role-gate.tsx`) wraps the common "only render this subtree if the user holds this role" case for simple layout decisions (e.g. "New release" button); resource-specific checks (`canReview`, `canOpenRequest`) are called directly where the resource is already in scope, not routed through `RoleGate`.

## Dual-role UX (BE §0, §6)

- `dashboard/page.tsx` renders whichever of `developer` / `approver` sections `GET /api/dashboard` returns non-null, as stacked sections (not tabs that hide one behind a click — a dual-role user's whole point is seeing both at a glance).
- Request cards owned by the current dual-role user never show review buttons, even in an approver-facing list — enforced by `canReview` returning `false` via the ownership check, matching BE's `mine: true` flag and `403 SELF_REVIEW_FORBIDDEN` backstop.
