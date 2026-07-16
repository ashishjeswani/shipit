# 06 — State Management

Two stores, deliberately not one. Mixing server-state caching and ephemeral client state into a single store is the most common way these apps rot — keep the boundary sharp.

## TanStack Query = server state

Every REST response lives here. Query keys are centralized in `lib/query/keys.ts` so invalidation from the realtime layer ([05](05-realtime.md)) and mutations never disagree on what a key looks like:

```ts
export const keys = {
  dashboard: () => ["dashboard"] as const,
  releases: {
    list: (status?: ReleaseStatus) => ["releases", { status }] as const,
  },
  release: (id: number) => ["releases", id] as const,
  requests: {
    list: (releaseId: number) => ["releases", releaseId, "requests"] as const,
  },
  request: (id: number) => ["requests", id] as const,
  requestHistory: (id: number) => ["requests", id, "history"] as const,
  requestMessages: (id: number) => ["requests", id, "messages"] as const,
  notifications: {
    list: () => ["notifications"] as const,
    unreadCount: () => ["notifications", "unread-count"] as const,
  },
  users: (role?: Role) => ["users", { role }] as const,
}
```

Defaults (`lib/query/query-client.ts`):
- `staleTime: 30_000` for list/detail queries — the realtime layer is what keeps things fresh in practice; a 30s stale window just protects against redundant fetches on rapid remounts, not a substitute for invalidation.
- `refetchOnWindowFocus: true` — cheap safety net for the "closed laptop lid" class of staleness the BE explicitly calls out (BE §8 rule 1).
- Mutations always call `queryClient.invalidateQueries` for every key listed in [04](04-api-endpoint-map.md)'s consumer column, not just the one the screen currently cares about — a release status change affects both the release detail and the releases list, for example.

## Zustand = ephemeral client state

Two stores, both in `stores/`:

### `auth-store.ts`
```ts
interface AuthState {
  user: User | null
  status: "loading" | "authenticated" | "unauthenticated"
  setUser: (user: User) => void
  clear: () => void
}
```
Populated once on app boot from `GET /api/auth/me` (via `useAuth`), cleared on logout or any `401`. This is **not** persisted to `localStorage` directly — the token itself lives in the cookie ([07](07-auth-and-permissions.md)); this store only holds the decoded user profile for fast synchronous reads (role gates, header greeting) without re-fetching `/auth/me` on every render.

### `realtime-store.ts`
```ts
interface RealtimeState {
  connectionStatus: "connecting" | "open" | "closed"
  reviewingBy: Record<number, UserSummary | undefined> // requestId -> approver
  lastSeenNotificationId: number
  setConnectionStatus: (s: RealtimeState["connectionStatus"]) => void
  setReviewing: (requestId: number, by: UserSummary | null) => void
  bumpLastSeen: (id: number) => void
}
```
`reviewingBy` is the one place ephemeral WS data is trusted directly (see [05](05-realtime.md)) — everything else the WS layer touches goes through Query invalidation instead.

## Why not put everything in Query (e.g. via `setQueryData` from WS)

Tempting, but `reviewingBy` has no REST-fetchable source of truth on its own (it's derived transiently from `GET /api/requests/{id}`'s `reviewingBy` field *or* pushed via WS — two different shapes for the same concept), and connection status has no REST equivalent at all. Forcing both into Query keys would mean inventing fake query keys that are never actually fetched, which defeats the purpose of using a fetch-cache library. Zustand for state that isn't "the result of a request," Query for state that is.

## Why not put releases/requests in Zustand instead of Query

Query gives us, for free, exactly what BE §8 rule 2 demands: treat WS as a hint, re-fetch REST as truth. `invalidateQueries` + automatic refetch-on-mount/focus *is* that pattern. Reimplementing it by hand in Zustand (loading flags, error flags, manual refetch triggers) is pure duplicated effort with more bug surface.
