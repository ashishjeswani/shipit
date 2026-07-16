# 05 — Realtime Layer (FE)

Implements BE §8 exactly. This is the highest-weighted requirement in the problem statement — treat this doc as load-bearing, not optional polish.

## Connection lifecycle (`lib/realtime/stomp-client.ts`)

- One singleton `Client` (from `@stomp/stompjs`) for the whole app, created lazily on first authenticated mount, torn down on logout.
- Transport: `webSocketFactory: () => new SockJS(NEXT_PUBLIC_WS_URL)` — SockJS gives the BE's documented fallback for free (BE §8 transport).
- `connectHeaders: { Authorization: \`Bearer ${token}\` }` — read fresh from `lib/auth/token.ts` at connect time (and on every reconnect, in case of a fresh login in another tab).
- `reconnectDelay`: exponential-ish backoff (stompjs supports a fixed delay; wrap with jitter — e.g. 1s, 2s, 5s, 10s, cap 15s) so a BE restart doesn't get hammered by every open tab at once.
- Expose connection status to `realtime-store` (`"connecting" | "open" | "closed"`) — surfaced as a small dot/badge in `app-header.tsx` so users know if they're seeing live data (per BE §8 rule 2: WS is fire-and-forget, so users need to know when it's down).

## Subscription model (`lib/realtime/topics.ts`)

Destination builders, one function per BE §8 destination:

```ts
export const topics = {
  personalNotifications: () => "/user/queue/notifications",
  releasesAnnouncements: () => "/topic/releases",
  releaseRequests: (releaseId: number) => `/topic/releases/${releaseId}/requests`,
  request: (requestId: number) => `/topic/requests/${requestId}`,
  requestMessages: (requestId: number) => `/topic/requests/${requestId}/messages`,
}
```

`use-realtime.ts` is the **only** hook allowed to call `stompClient.subscribe`/`unsubscribe`. It takes a list of topic keys relevant to the current screen and manages subscribe-on-mount / unsubscribe-on-unmount, so screens declare intent rather than touching the client directly:

```ts
useRealtime([
  { topic: topics.request(requestId), onMessage: handleRequestEvent },
  { topic: topics.requestMessages(requestId), onMessage: handleMessageEvent },
])
```

The **personal queue** (`topics.personalNotifications()`) is subscribed once, globally, in `(app)/layout.tsx` — every authenticated screen needs it for the notification bell, regardless of which page is open.

## What each event does to the cache

WS events are **cache-invalidation hints, never payloads of record** (BE §8 reliability rule 2). The handler's job is almost always "invalidate this query key," occasionally "patch an ephemeral store," never "write server data into the Query cache directly from a WS payload."

| Event | Handler action |
|---|---|
| `RELEASE_CREATED` | Invalidate `keys.releases.list()`, `keys.dashboard()`. Toast: "New release: {payload.title}". |
| `ADDED_AS_APPROVER` | Invalidate `keys.releases.list()`, `keys.release(payload.releaseId)`. Toast. |
| `REQUEST_SUBMITTED` | Invalidate `keys.requests.list(payload.releaseId)`, `keys.dashboard()`. Toast if not the actor. |
| `REQUEST_REVIEW_STARTED` | **No REST invalidation** — write directly into `realtime-store.reviewingBy[payload.requestId] = actor` (this is the one legitimate case of trusting the WS payload as data, since it's inherently ephemeral and has no REST equivalent to re-fetch). |
| `REQUEST_REVIEW_STOPPED` | Clear `realtime-store.reviewingBy[payload.requestId]`. |
| `REQUEST_APPROVED` / `REQUEST_REJECTED` / `REQUEST_CHANGES_REQUESTED` | Invalidate `keys.request(payload.requestId)`, `keys.requests.list(payload.releaseId)`, `keys.requestHistory(payload.requestId)`, `keys.dashboard()`. Toast with the decision. |
| `MESSAGE_CREATED` | Invalidate `keys.requestMessages(payload.requestId)`, `keys.requests.list(payload.releaseId)` (for `unreadMessages`). Toast only if the request thread isn't currently focused. |

Every event also lands as a row in `GET /api/notifications` — the bell's list/unread-count queries get invalidated on **every** personal-queue message, unconditionally, rather than per-event-type special-casing.

## Reconnect = resync (BE §8 reliability rule 2)

On every `onConnect` (including reconnects, not just the first connect):

1. Call `notifications.list({ since: realtimeStore.lastSeenNotificationId })` to backfill anything missed while disconnected, then bump `lastSeenNotificationId` to the max `id` seen.
2. Invalidate (not just re-render) whatever the currently-mounted screen's primary query key is — e.g. on a request detail screen, invalidate `keys.request(id)`, `keys.requestMessages(id)`, `keys.requestHistory(id)`. `use-realtime.ts` keeps a ref to "current screen's keys to resync" so this is generic, not hardcoded per page.

## "X is reviewing" — TTL heartbeat (BE §8 rule 1)

- On mounting a request detail screen where the caller is an approver allowed to open the request and is **not** the owner: call `POST /requests/{id}/review/start` once immediately, then every **2 minutes** on an interval (`use-review-heartbeat.ts`), matching the BE's 5-minute TTL with margin.
- Clear the interval and call `POST /requests/{id}/review/stop` on unmount, on any decision action succeeding, and on tab close (`beforeunload` best-effort — the BE-side WS-disconnect clear is the real backstop, per BE §8 rule 1, so don't over-engineer the client-side unload handler).
- The heartbeat call is idempotent server-side — safe to fire without checking prior state.
- If the request is locked (`REQUEST_LOCKED`) or the caller is the owner, `use-review-heartbeat.ts` is simply not invoked — gate this the same way [07](07-auth-and-permissions.md)'s capability checks gate the review buttons.

## Subscription authorization (BE §8 rule 3)

BE rejects SUBSCRIBE frames for topics the user isn't entitled to (e.g. `/topic/requests/{id}` of a request locked to someone else). FE must handle a subscribe-time error/receipt failure gracefully:
- On subscription error, unsubscribe silently and rely on the already-rendered `locked-banner.tsx` (from the REST `403 REQUEST_LOCKED`) — don't surface a second, confusing "subscription failed" error on top of it.

## Sequence: reviewing indicator end-to-end

```mermaid
sequenceDiagram
    participant A as Approver A (request detail)
    participant B as Approver B (release requests list)
    participant BE as BE

    A->>BE: POST /requests/42/review/start
    BE-->>A: 200 { reviewingBy: A }
    BE-->>B: WS REQUEST_REVIEW_STARTED (topic: releases/10/requests)
    B->>B: realtimeStore.reviewingBy[42] = A ; request-card shows "A is reviewing"
    Note over A: heartbeat re-POSTs review/start every 2 min
    A->>BE: POST /requests/42/approve
    BE-->>A: 200 updated request
    BE-->>B: WS REQUEST_REVIEW_STOPPED + REQUEST_APPROVED
    B->>B: clear reviewingBy[42]; invalidate request list/dashboard
```
