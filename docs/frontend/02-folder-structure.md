# 02 — Folder Structure

Builds on the existing scaffold (`app/`, `components/ui/`, `lib/`, `hooks/`, `components.json` shadcn aliases). New top-level dirs: `stores/`, `docs/`.

```
shipit/
├── app/
│   ├── layout.tsx                      # existing root layout (theme provider etc.)
│   ├── page.tsx                        # redirect to /dashboard or /login
│   ├── globals.css
│   ├── (auth)/
│   │   └── login/
│   │       └── page.tsx
│   └── (app)/                          # authenticated shell
│       ├── layout.tsx                  # header, nav, notification bell, mounts realtime provider
│       ├── dashboard/
│       │   └── page.tsx
│       ├── releases/
│       │   ├── page.tsx                # release list + "New release" (approvers only)
│       │   └── [releaseId]/
│       │       ├── page.tsx            # release detail: info, approvers, requests list
│       │       └── requests/
│       │           └── new/
│       │               └── page.tsx    # create request form (developers only)
│       └── requests/
│           └── [requestId]/
│               └── page.tsx            # request detail: file, history, conversation, review actions
│
├── components/
│   ├── ui/                             # shadcn primitives (existing + additions, see below)
│   ├── layout/
│   │   ├── app-header.tsx
│   │   ├── role-tabs.tsx               # dashboard tab switcher for dual-role users
│   │   ├── theme-toggle.tsx            # light/dark toggle (next-themes)
│   │   └── notification-bell.tsx
│   ├── releases/
│   │   ├── release-card.tsx
│   │   ├── release-list.tsx
│   │   ├── release-status-badge.tsx
│   │   ├── release-status-menu.tsx     # OPEN/READY_FOR_DEPLOYMENT/CLOSED transitions
│   │   ├── create-release-dialog.tsx
│   │   ├── add-approvers-dialog.tsx
│   │   └── approver-picker.tsx         # shared user-picker (also used for assignedReviewer)
│   ├── requests/
│   │   ├── request-card.tsx            # row in a list; shows locked/reviewing/unread badges
│   │   ├── request-list.tsx
│   │   ├── request-status-badge.tsx
│   │   ├── create-request-form.tsx
│   │   ├── edit-request-form.tsx
│   │   └── detail/
│   │       ├── request-header.tsx
│   │       ├── file-download-button.tsx
│   │       ├── history-timeline.tsx
│   │       ├── review-actions.tsx      # approve / reject / request-changes
│   │       ├── reviewing-banner.tsx    # "Carol Approver is reviewing"
│   │       └── locked-banner.tsx       # 403 REQUEST_LOCKED friendly message
│   ├── conversation/
│   │   ├── message-list.tsx
│   │   ├── message-item.tsx
│   │   └── message-composer.tsx
│   ├── notifications/
│   │   ├── notification-list.tsx
│   │   └── notification-item.tsx
│   └── common/
│       ├── empty-state.tsx
│       ├── error-banner.tsx
│       ├── role-gate.tsx               # <RoleGate role="APPROVER"> conditional render
│       ├── confirm-dialog.tsx
│       └── relative-time.tsx
│
├── hooks/
│   ├── use-auth.ts                     # login/logout, current session (reads/writes auth-store)
│   ├── use-dashboard.ts
│   ├── use-releases.ts
│   ├── use-release.ts
│   ├── use-release-mutations.ts        # create, status change, add/remove approvers
│   ├── use-requests.ts                 # list for a release
│   ├── use-request.ts                  # single request detail
│   ├── use-request-mutations.ts        # create, edit, submit, replace file, delete
│   ├── use-review-actions.ts           # start/stop review, approve, reject, request-changes
│   ├── use-review-heartbeat.ts         # re-POST review/start every 2 min while screen open
│   ├── use-request-messages.ts
│   ├── use-notifications.ts
│   └── use-realtime.ts                 # subscribes topics for current screen, wires cache invalidation
│
├── lib/
│   ├── utils.ts                        # existing cn() helper
│   ├── constants.ts                    # enums mirrored from BE §1 (statuses), file limits from BE §0
│   ├── format-date.ts
│   ├── api/
│   │   ├── client.ts                   # fetch wrapper: base URL, auth header, JSON/multipart, error mapping
│   │   ├── auth.ts                     # login, me
│   │   ├── users.ts                    # GET /api/users
│   │   ├── releases.ts                 # BE §3
│   │   ├── requests.ts                 # BE §4
│   │   ├── storage.ts                  # live /api/v1/storage upload + download
│   │   ├── storage-coords.ts           # sessionStorage for Storage uuid after create
│   │   ├── messages.ts                 # BE §5
│   │   ├── dashboard.ts                # BE §6
│   │   └── notifications.ts            # BE §7
│   ├── realtime/
│   │   ├── stomp-client.ts             # singleton STOMP client over SockJS, connect/disconnect/reconnect
│   │   ├── topics.ts                   # destination string builders (BE §8 table)
│   │   └── types.ts                    # WsEnvelope<T>, event name union
│   ├── auth/
│   │   ├── token.ts                    # get/set/clear the shipit_token cookie
│   │   └── capabilities.ts             # hasRole, isOwner, canOpenRequest, canReview — mirrors BE §9
│   ├── query/
│   │   ├── query-client.ts             # QueryClient instance + provider
│   │   └── keys.ts                     # query key factory (single source of truth for cache keys)
│   └── types/
│       ├── api.ts                      # DTOs mirroring BE responses (see 03-data-model.md)
│       └── errors.ts                   # ApiError shape + ErrorCode union (BE §0 catalog)
│
├── stores/
│   ├── auth-store.ts                   # zustand: current user, roles, session-loaded flag
│   └── realtime-store.ts               # zustand: connection status, reviewingBy map, lastSeenNotificationId
│
├── middleware.ts                       # redirect unauthenticated visitors away from (app)/*
│
└── docs/
    ├── BACKEND_API_GUIDE.md
    └── frontend/
        └── *.md  (this spec)
```

## New dependencies to add when implementation starts

```bash
pnpm add @tanstack/react-query zustand react-hook-form @hookform/resolvers zod \
  @stomp/stompjs sockjs-client
pnpm add -D @types/sockjs-client
```

## shadcn components to add (beyond the existing `button`)

```bash
npx shadcn@latest add dialog dropdown-menu badge avatar tabs form input textarea \
  select table separator card skeleton scroll-area tooltip alert sonner
```

Use `sonner` for toasts (error/success feedback, BE §0 error codes → toast copy per [09-error-handling.md](09-error-handling.md)).

## Naming conventions

- Files: kebab-case. Components: `PascalCase` export, kebab-case filename matching it.
- One React component per file; co-locate a component's tiny private sub-parts in the same file only if they're not reused elsewhere.
- Hooks always prefixed `use-`, return `{ data, isLoading, error, ...mutations }` shape consistent with TanStack Query conventions — don't invent a bespoke shape per hook.
