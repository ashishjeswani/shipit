# 08 — UI Architecture

## Route tree

```
/login                                   (auth)/login
/dashboard                               (app)/dashboard
/releases                                (app)/releases
/releases/[releaseId]                    (app)/releases/[releaseId]
/releases/[releaseId]/requests/new       (app)/releases/[releaseId]/requests/new
/requests/[requestId]                    (app)/requests/[requestId]
```

No nested request routes under a release (`/releases/[id]/requests/[reqId]`) — requests get a flat top-level route (`/requests/[requestId]`) because a request is meaningfully identified on its own (deep-linkable from a notification payload which only carries `requestId`, per BE §7 `payload` shape) and its release is just a field on it, not a required navigational parent.

## Screen-by-screen

### `/login`
- **Purpose:** username/password form → `POST /api/auth/login` → set cookie → redirect to `/dashboard`.
- **Data:** none until submit.
- **Components:** a single form (react-hook-form + zod), no shared components needed.
- **Realtime:** none.
- **Errors:** `401 INVALID_CREDENTIALS` → inline form error, not a toast (the user is looking right at the form).

### `/dashboard`
- **Purpose:** the landing page — role-aware summary + entry points into releases/requests.
- **Data:** `useDashboard()` → `GET /api/dashboard` (BE §6).
- **Components:** stacked sections — `developer` block (status-count tiles + "My requests" shortcut) and/or `approver` block (`pendingReviews`, `assignedToMe` tiles), plus a `release-accordion-list.tsx`: every release, each expandable via `use-requests(releaseId)` to the requests visible to the caller in it — own requests only for a DEVELOPER-only caller, all requests (tagged `mine`) for anyone holding APPROVER.
- **Role visibility:** render whichever of `developer`/`approver` is non-null; dual-role sees both, stacked (see [07](07-auth-and-permissions.md) dual-role UX).
- **Realtime:** invalidated by `RELEASE_CREATED`, `REQUEST_SUBMITTED`, any decision event (see [05](05-realtime.md) table) — counts update live without a manual refresh.

### `/releases`
- **Purpose:** browse all releases, filter by status, create a new one (approvers only).
- **Data:** `useReleases(statusFilter)` → `GET /api/releases`.
- **Components:** `release-list.tsx` of `release-card.tsx` (name, status badge, approvers avatars, request/my-request counts), `create-release-dialog.tsx` gated by `canCreateRelease` (BE §9: create release = APPROVER only).
- **Realtime:** `RELEASE_CREATED` invalidates the list; a toast announces it to developers per BE §8 (they're the notified party).

### `/releases/[releaseId]`
- **Purpose:** release detail — description, approvers, status transition control, and the request list scoped to this release.
- **Data:** `useRelease(id)` (BE §3 detail) + `useRequests(id)` (BE §4 list, role-aware per BE: developer sees own only, approver sees all-non-draft-plus-locked).
- **Components:** release header (name/description/status), `release-status-menu.tsx` (gated: only approvers **on this release** — check `release.approvers` includes current user, matching BE's `NOT_RELEASE_APPROVER`), `add-approvers-dialog.tsx`, `request-list.tsx` of `request-card.tsx`, a "New request" button gated by `canCreateRequest` (developer + release is `OPEN`).
- **`request-card.tsx` states to render:**
  - `locked: true` → greyed out, tooltip "Restricted to {assignedReviewer.name}", not clickable to open (still visible per BE §4 — clicking still navigates but the detail page shows `locked-banner.tsx` from the resulting `403`, so this is defense-in-depth, not the only gate).
  - `reviewingBy` (from `realtime-store`, falling back to the field on the list response) → small "{name} is reviewing" label, doesn't disable anything (BE §8: does not lock).
  - `unreadMessages > 0` → badge.
  - `mine: true` (dual-role viewing own request in an approver-flavored list) → no review affordances rendered at all.
- **Realtime:** subscribes `topics.releaseRequests(releaseId)` while mounted — `REQUEST_SUBMITTED`, `REQUEST_REVIEW_STARTED/STOPPED` update the list in place.

### `/releases/[releaseId]/requests/new`
- **Purpose:** developer creates a request: title, description, script file, optional assigned reviewer, save as Draft or submit directly.
- **Data:** `useReleaseMutations` isn't needed here — only `useRequestMutations().create`; `useUsers("APPROVER")` for the reviewer picker.
- **Guard:** redirect back to the release page if `!canCreateRequest` (wrong role or release not `OPEN` — BE `409 RELEASE_NOT_OPEN`).
- **Components:** `create-request-form.tsx` — react-hook-form + zod mirroring BE §0 limits (title 1–150, description 1–5000, file ext `py`/`js`/`sh` ≤ 5MB) so the user sees validation before the multipart round-trip fails.
- **Submit behavior:** two buttons — "Save as draft" (`status: DRAFT`) and "Submit for approval" (`status: PENDING_APPROVAL`) map to the same `POST` with a different `status` field (BE §4 create).

### `/requests/[requestId]`
The busiest screen — the whole review workflow lives here.
- **Data:** `useRequest(id)` (BE §4 detail — handle its three outcomes: 200 detail w/ optional `reviewingBy`, `403 REQUEST_LOCKED`, `404` for someone else's draft), `useRequestHistory(id)`, `useRequestMessages(id)`.
- **Layout:** two-column on desktop — left: description, file download, status, history timeline, review actions; right: conversation thread. Single column stacked on mobile (history/actions above the fold, conversation below).
- **Components:**
  - `request-header.tsx` — title, status badge, owner, assigned reviewer, release link.
  - `locked-banner.tsx` — rendered instead of the whole detail body on `403 REQUEST_LOCKED` ("This request is restricted to {name} for review.").
  - `reviewing-banner.tsx` — rendered above the body (not blocking) when `reviewingBy` is present and it's not the current user.
  - `file-download-button.tsx` — triggers the blob-download flow (see [09](09-error-handling.md) for the auth-header-on-download nuance); no inline preview, per problem statement ("just a download button").
  - `history-timeline.tsx` — renders BE §4 history array as a vertical timeline (event label + actor + relative time).
  - `review-actions.tsx` — Approve / Reject / Request changes buttons, each opening a small comment dialog (`confirm-dialog.tsx` variant) — comment optional for approve/reject, **required** for request-changes (BE §4). Gated by `canReview`; entirely absent (not just disabled) for the owner or non-reviewers, so a screenshot of this page never shows "approve your own request" as a greyed-out temptation.
  - `edit-request-form.tsx` — shown instead of the read-only header fields when `canEditRequest` is true (owner + `DRAFT`/`CHANGES_REQUESTED`); includes the file-replace control.
  - `message-list.tsx` / `message-composer.tsx` — the conversation; composer disabled (not hidden) with an explanatory tooltip if `!canOpenRequest`.
- **On mount (approver, allowed to open, not owner):** fire `review/start` + start the heartbeat ([05](05-realtime.md)); on unmount or decision, `review/stop`.
- **On mount (any allowed viewer):** call `messages/mark-read` so the request list's `unreadMessages` clears.
- **Realtime:** subscribes `topics.request(id)` and `topics.requestMessages(id)` while mounted.

## Shared layout (`(app)/layout.tsx`)

- `app-header.tsx`: logo/title, `role-tabs.tsx` (only meaningful if you want a quick dashboard/releases nav, not a role switcher — a dual-role user isn't "switching roles," they always see both), `notification-bell.tsx`, connection-status dot ([05](05-realtime.md)), user menu (name, logout).
- Mounts the realtime provider (STOMP connect + personal-queue subscription) once `auth-store.status === "authenticated"`.

## Empty/loading/error conventions

- Every list screen: skeleton rows (shadcn `skeleton`) while loading, `empty-state.tsx` with role-appropriate copy when empty (e.g. developer with zero requests in a release sees "You haven't created a request yet" + CTA; approver sees "No requests in this release yet").
- Every mutation button shows its own pending state (disable + spinner), never a full-page loading overlay — other parts of the screen (e.g. the conversation) stay interactive during an unrelated action.
