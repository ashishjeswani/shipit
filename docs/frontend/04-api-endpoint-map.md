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
| `POST /api/releases/{releaseId}/requests` (multipart) | `requests.create(releaseId, formData)` | `useRequestMutations().create` | `create-request-form.tsx` |
| `GET /api/releases/{releaseId}/requests` | `requests.listForRelease(releaseId)` | `useRequests(releaseId)` | `releases/[releaseId]/page.tsx` (request list) |
| `GET /api/requests/{id}` | `requests.get(id)` | `useRequest(id)` | `requests/[requestId]/page.tsx` |
| `PATCH /api/requests/{id}` | `requests.update(id, dto)` | `useRequestMutations().update` | `edit-request-form.tsx` |
| `DELETE /api/requests/{id}` | `requests.remove(id)` | `useRequestMutations().remove` | draft request card menu |
| `PUT /api/requests/{id}/file` (multipart) | `requests.replaceFile(id, formData)` | `useRequestMutations().replaceFile` | `edit-request-form.tsx` |
| `POST /api/requests/{id}/submit` | `requests.submit(id)` | `useRequestMutations().submit` | request detail + create form ("save as draft" vs "submit") |
| `GET /api/requests/{id}/file` (binary) | `requests.downloadFile(id)` | `useRequestMutations().download` (not cached in Query — see [09](09-error-handling.md)) | `file-download-button.tsx` |
| `GET /api/requests/{id}/history` | `requests.history(id)` | `useRequestHistory(id)` | `history-timeline.tsx` |
| `POST /api/requests/{id}/review/start` | `requests.startReview(id)` | `useReviewActions(id).start`, polled by `useReviewHeartbeat(id)` | request detail on mount (approver, allowed to open) |
| `POST /api/requests/{id}/review/stop` | `requests.stopReview(id)` | `useReviewActions(id).stop` | request detail unmount / after decision |
| `POST /api/requests/{id}/approve` | `requests.approve(id, comment?)` | `useReviewActions(id).approve` | `review-actions.tsx` |
| `POST /api/requests/{id}/reject` | `requests.reject(id, comment?)` | `useReviewActions(id).reject` | `review-actions.tsx` |
| `POST /api/requests/{id}/request-changes` | `requests.requestChanges(id, comment)` | `useReviewActions(id).requestChanges` | `review-actions.tsx` |

## Conversation (BE §5)

| Endpoint | `lib/api` fn | Hook | Consumers |
|---|---|---|---|
| `GET /api/requests/{id}/messages` | `messages.list(requestId)` | `useRequestMessages(requestId)` | `message-list.tsx` |
| `POST /api/requests/{id}/messages` | `messages.create(requestId, text)` | `useRequestMessages(requestId).send` | `message-composer.tsx` |
| `POST /api/requests/{id}/messages/mark-read` | `messages.markRead(requestId)` | `useRequestMessages(requestId)` (called on thread focus/mount) | `requests/[requestId]/page.tsx` |

## Dashboard (BE §6)

| Endpoint | `lib/api` fn | Hook | Consumers |
|---|---|---|---|
| `GET /api/dashboard` | `dashboard.get()` | `useDashboard()` | `dashboard/page.tsx` |

## Notifications (BE §7)

| Endpoint | `lib/api` fn | Hook | Consumers |
|---|---|---|---|
| `GET /api/notifications?unreadOnly=&since=` | `notifications.list(opts)` | `useNotifications()` | `notification-bell.tsx`, backfill in `use-realtime.ts` |
| `GET /api/notifications/unread-count` | `notifications.unreadCount()` | `useNotifications()` | `notification-bell.tsx` badge |
| `PATCH /api/notifications/{id}/read` | `notifications.markRead(id)` | `useNotifications().markRead` | `notification-item.tsx` |
| `POST /api/notifications/read-all` | `notifications.markAllRead()` | `useNotifications().markAllRead` | `notification-list.tsx` header action |

## Not called from FE (BE-internal or out of scope)

- `GET /api/health`, `POST /api/dev/reset` — ops-only, not surfaced in the UI.
- Everything in BE §10 (FCM, execution, file versions) — explicitly out of scope per [00-overview.md](00-overview.md).
