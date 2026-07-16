# 05 — Realtime Layer (FE)

Implements live delivery for notifications and the "X is reviewing" presence signal.

> **Transport choice (explicitly requested, 2026-07-16):** this pass uses **Pusher JS** + **FCM Web Push** rather than the STOMP/SockJS stack originally specified against BE §8. REST remains the source of truth for notifications and request state; Pusher/FCM are cache-invalidation / ephemeral-presence hints only (same reliability rule as BE §8 rule 2). The STOMP plan below is retained as the alternate path if the team later drops Pusher.

## What is built now

| Concern | Implementation |
|---|---|
| Bell live push | `hooks/use-notifications-realtime.ts` → `private-user-{userId}` / `new-notification` → invalidate notification queries |
| Offline / background push | `hooks/use-fcm-notifications.ts` + `lib/firebase/config.ts` + `public/firebase-messaging-sw.js` → register token via `POST /api/notifications/device-tokens`; foreground `onMessage` also invalidates |
| "X is reviewing" | `hooks/use-request-presence.ts` → subscribe `presence-request-{id}` / `review-status-changed` → `realtime-store.reviewingBy`; eligible approver on detail calls `POST /api/notifications/presence/reviewing` |
| Auth for private/presence channels | `pusher-js` `channelAuthorization` → `POST /api/notifications/pusher/auth` with bearer from `getStoredToken()` |
| Logout cleanup | `unregisterFcmDeviceToken()` + `disconnectPusher()` inside `useAuth().logout` |

## Pusher client (`lib/realtime/pusher-client.ts`)

- One shared singleton (`getPusherClient()`), created lazily on first authenticated subscribe, torn down on logout via `disconnectPusher()`.
- `headersProvider` supplies a fresh `Authorization: Bearer …` on every channel auth request (token may rotate across tabs/login).
- Connection status is mirrored into `realtime-store.connectionStatus`.

## "X is reviewing" sequence

```mermaid
sequenceDiagram
    participant A as Approver A (request detail)
    participant B as Approver B (request list)
    participant BE as BE
    participant P as Pusher

    A->>BE: POST /api/notifications/presence/reviewing?requestId=42&isReviewing=true
    BE->>P: review-status-changed on presence-request-42
    P-->>B: { approverName, isReviewing: true }
    B->>B: realtimeStore.reviewingBy[42] = A ; request-card shows "A is reviewing"
    Note over A: leaving the detail page (or losing canReview) clears presence
    A->>BE: POST .../presence/reviewing?isReviewing=false
    BE->>P: review-status-changed { isReviewing: false }
    P-->>B: clear reviewingBy[42]
```

- Cards/detail merge `liveReviewer ?? request.reviewingBy` so a fresh REST snapshot still works if Pusher is down.
- Heartbeat gate matches `canReview` (ownership first, then APPROVER + PENDING_REVIEW + open) — never self-review.

## FCM notes

- Public config + VAPID only on the client (`lib/constants.ts` / `.env.example`). Never ship `serviceAccountKey.json`.
- Service worker must stay at `public/firebase-messaging-sw.js` (exact path Firebase expects).
- Foreground handlers must **not** invent notification rows with client-side ids — invalidate and let `GET /api/notifications` refetch.

---

## Alternate plan: STOMP/SockJS (BE §8) — not built this pass

### Connection lifecycle (`lib/realtime/stomp-client.ts`)

- One singleton `Client` (from `@stomp/stompjs`) for the whole app, created lazily on first authenticated mount, torn down on logout.
- Transport: `webSocketFactory: () => new SockJS(NEXT_PUBLIC_WS_URL)` — SockJS gives the BE's documented fallback for free (BE §8 transport).
- `connectHeaders: { Authorization: \`Bearer ${token}\` }` — read fresh from `lib/auth/token.ts` at connect time (and on every reconnect).
- Expose connection status to `realtime-store` (`"connecting" | "open" | "closed"`).

### Subscription model (`lib/realtime/topics.ts`)

```ts
export const topics = {
  personalNotifications: () => "/user/queue/notifications",
  releasesAnnouncements: () => "/topic/releases",
  releaseRequests: (releaseId: number) => `/topic/releases/${releaseId}/requests`,
  request: (requestId: number) => `/topic/requests/${requestId}`,
  requestMessages: (requestId: number) => `/topic/requests/${requestId}/messages`,
}
```

### STOMP "X is reviewing" — TTL heartbeat (BE §8 rule 1)

- Eligible approver on request detail: `POST /requests/{id}/review/start` immediately, then every 2 minutes; `POST .../review/stop` on unmount/decision.
- WS `REQUEST_REVIEW_STARTED` / `STOPPED` → write/clear `realtime-store.reviewingBy` (same store as the Pusher path).
