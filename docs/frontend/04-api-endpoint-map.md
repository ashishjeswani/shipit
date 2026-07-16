# 04 — API Endpoint Map

Every BE endpoint, the `lib/api/*` function that wraps it, the hook that calls it, and what consumes it. This is the file to update first when a screen needs a new call — check whether it already exists here before writing a new `lib/api` function.

## Auth (BE §2)

| Endpoint | `lib/api` fn | Hook | Consumers |
|---|---|---|---|
| `POST /api/auth/login` | `auth.login(username, password)` | `useAuth().login` | `(auth)/login/page.tsx` |
| `GET /api/auth/me` | `auth.me()` | `useAuth()` (bootstraps `auth-store` on app load) | `(app)/layout.tsx` |
| `GET /api/users?role=` | `users.list(role?)` | `useUsers(role)` | `approver-picker.tsx` (release approvers, assigned reviewer) |

## Releases (BE §3)

| Endpoint | `lib/api` fn | Hook | Consumers |
|---|---|---|---|
| `POST /api/releases` | `releases.create(dto)` | `useReleaseMutations().create` | `create-release-dialog.tsx` |
| `GET /api/releases?status=` | `releases.list(status?)` | `useReleases(status?)` | `releases/page.tsx` |
| `GET /api/releases/{id}` | `releases.get(id)` | `useRelease(id)` | `releases/[releaseId]/page.tsx` |
| `PATCH /api/releases/{id}/status` | `releases.updateStatus(id, status)` | `useReleaseMutations().updateStatus` | `release-status-menu.tsx` |
| `POST /api/releases/{id}/approvers` | `releases.addApprovers(id, approverIds)` | `useReleaseMutations().addApprovers` | `add-approvers-dialog.tsx` |
| `DELETE /api/releases/{id}/approvers/{userId}` | `releases.removeApprover(id, userId)` | `useReleaseMutations().removeApprover` | release detail approvers list |

## Deployment requests (BE §4)

| Endpoint | `lib/api` fn | Hook | Consumers |
|---|---|---|---|
| `POST /api/releases/{releaseId}/requests` (multipart) | `requests.create(input)` | `useRequestMutations().create` | `create-request-form.tsx` (via createAndSubmit) |
| `GET /api/deployment-requests` | `requests.list()` | `useRequests()` | release request lists (client-filtered by releaseId) |
| `GET /api/deployment-requests/{id}` | `requests.get(id)` | `useRequest(id)` | `requests/[requestId]/page.tsx` |
| `PUT /api/deployment-requests/{id}` | `requests.updateTitle(id, title)` | `useRequestMutations().updateTitle` | edit title |
| `DELETE /api/deployment-requests/{id}` | `requests.remove(id)` | `useRequestMutations().remove` | draft request card menu |
| `PUT /api/requests/{id}/file` (multipart) | `requests.replaceFile(id, file)` | `useRequestMutations().replaceFile` | `edit-request-form.tsx` |
| `POST /api/requests/{id}/submit` | `requests.submit(id)` | `useRequestMutations().submit` | `request-card.tsx`, request detail |
| `GET /api/requests/{id}/file` (binary) | `requests.downloadFile(id)` | used by `file-download-button.tsx` when Storage coords are absent | `file-download-button.tsx` |
| `POST /api/requests/{id}/approve` | `requests.approve(id, comment?)` | `useReviewActions().approve` | `review-actions.tsx`, `request-card.tsx` |
| `POST /api/requests/{id}/reject` | `requests.reject(id, comment?)` | `useReviewActions().reject` | `review-actions.tsx` |
| `POST /api/requests/{id}/request-changes` | `requests.requestChanges(id, comment)` | `useReviewActions().requestChanges` | `review-actions.tsx` |

Create-for-approval (`useRequestMutations().createAndSubmit`) is **not** a single BE call: it uploads the script via Storage, then creates the request with `status=PENDING_APPROVAL` on the multipart release endpoint (live create accepts that status — no follow-up submit needed).

## Storage (live swagger "Storage" tag)

| Endpoint | `lib/api` fn | Hook | Consumers |
|---|---|---|---|
| `POST /api/v1/storage/upload?userId=&prefix=` (multipart `file`) | `storage.upload(userId, file, prefix?)` | inside `requests.createAndSubmit` | `create-request-form.tsx` |
| `GET /api/v1/storage/{userId}/{uuid}` | `storage.download(userId, uuid)` | `file-download-button.tsx` | download when create stamped Storage coords |
| `GET /api/v1/storage/{userId}/{prefix}/{uuid}` | `storage.download(userId, uuid, prefix)` | same | download with prefix (`scripts`) |

Upload response shape (live): `{ uuid, userId }`. Coords are kept in `sessionStorage` (`lib/api/storage-coords.ts`) because `FileSummaryDto` does not return them.

## Conversation (BE §5 / live swagger "Conversations")

Live `MessageEntity` returns `senderId` (not an embedded `sender`); `useRequestMessages` enriches via `useUsers` into the FE `ConversationMessage` shape. Soft-deleted rows (`status: DELETED`) are filtered out client-side.

| Endpoint | `lib/api` fn | Hook | Consumers |
|---|---|---|---|
| `GET /api/requests/{id}/messages` | `messages.list(requestId)` | `useRequestMessages(requestId)` | `message-list.tsx` via request detail |
| `POST /api/requests/{id}/messages` `{ text }` | `messages.create(requestId, text)` | `useRequestMessages(requestId).send` | `message-composer.tsx` |
| `POST /api/requests/{id}/messages/mark-read` | `messages.markRead(requestId)` | `useRequestMessages` (on successful list fetch) | clears `unreadMessages` on request cards |

## Dashboard (BE §6)

| Endpoint | `lib/api` fn | Hook | Consumers |
|---|---|---|---|
| `GET /api/dashboard` | `dashboard.get()` | `useDashboard()` | `dashboard/page.tsx` |

## Notifications (BE §7 + FCM/Pusher presence guide)

| Endpoint | `lib/api` fn | Hook | Consumers |
|---|---|---|---|
| `GET /api/notifications?unreadOnly=false&since=` | `notifications.list(since?)` | `useNotifications()` | `notification-bell.tsx` |
| `GET /api/notifications/unread-count` | `notifications.unreadCount()` | `useNotifications()` | `notification-bell.tsx` badge |
| `PATCH /api/notifications/{id}/read` | `notifications.markRead(id)` | `useNotificationMutations().markRead` | `notification-bell.tsx` item click |
| `POST /api/notifications/read-all` | `notifications.markAllRead()` | `useNotificationMutations().markAllRead` | `notification-bell.tsx` header action |
| `POST /api/notifications/device-tokens` `{ deviceToken, deviceType: "WEB" }` | `notifications.registerDeviceToken(token)` | `useFcmNotifications` via `registerFcmDeviceToken` | `notification-bell.tsx` (on auth) |
| `DELETE /api/notifications/device-tokens?token=` | `notifications.deleteDeviceToken(token)` | `useAuth().logout` | logout cleanup |
| `POST /api/notifications/presence/reviewing?requestId=&isReviewing=` | `notifications.setReviewingPresence(id, bool)` | `useReviewPresenceHeartbeat` | request detail (eligible approver) |
| `POST /api/notifications/pusher/auth` | called by `pusher-js` (not wrapped) | `getPusherClient()` | private + presence channel subscribe |

**Live push transports (explicitly requested):**
- **FCM** — `lib/firebase/config.ts` + `public/firebase-messaging-sw.js` + `hooks/use-fcm-notifications.ts`. Foreground `onMessage` invalidates notification Query keys (REST remains source of truth); background uses the service worker.
- **Pusher** — singleton `lib/realtime/pusher-client.ts`. Bell: `private-user-{userId}` / `new-notification`. Presence: `presence-request-{requestId}` / `review-status-changed` → `realtime-store.reviewingBy` (the one sanctioned ephemeral write; see [05](05-realtime.md), [06](06-state-management.md)).

## Not called from FE (BE-internal or out of scope)

- `GET /api/health`, `POST /api/dev/reset` — ops-only, not surfaced in the UI.
- BE §10 containerized execution / in-browser file versions — still out of scope. FCM device push is **in scope** via the `/api/notifications/device-tokens` endpoints above (not the older §10a `/api/devices/*` paths).
- STOMP/SockJS personal queue (`/user/queue/notifications`) — deferred; Pusher + FCM cover live delivery for this pass.