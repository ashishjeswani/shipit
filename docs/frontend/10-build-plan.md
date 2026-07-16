# 10 — Build Plan (FE)

Mirrors the shape of BE §12's suggested build order, but sequenced for the frontend specifically. Each phase should be demoable end-to-end against a running BE before moving to the next — don't build three phases of UI against a mental model of the API; run it against the real thing.

1. **Scaffold the shared substrate** — `lib/api/client.ts`, `lib/types/*`, `lib/constants.ts`, `lib/query/*`, `stores/auth-store.ts`, `lib/auth/token.ts` + `capabilities.ts`, `middleware.ts`. Nothing user-visible yet, but everything else depends on it.
2. **Auth** — `/login` page, `useAuth`, session bootstrap in `(app)/layout.tsx`. Demoable: log in as each seeded user (BE §2 table), confirm redirect + `/auth/me` populates the header.
3. **Releases (read + create)** — `/releases`, `/releases/[id]`, `create-release-dialog.tsx`, `add-approvers-dialog.tsx`, status transitions. Demoable: approver creates a release, developer sees it appear (still no realtime yet — manual refresh is fine at this stage).
4. **Requests (read + create)** — create-request form with multipart upload, request list on the release page, request detail page (read-only parts: header, file download, description). Demoable: developer creates a draft and a submitted request; approver opens the submitted one, downloads the file.
5. **Request lifecycle** — submit/edit/delete-draft, approve/reject/request-changes with the comment dialog, history timeline. Demoable: full happy path draft → submit → changes-requested → resubmit → approve, with the audit trail visible.
6. **Conversation** — message list/composer, mark-read, unread badges on request cards.
7. **Realtime** — STOMP client, `use-realtime`, personal-queue subscription + notification bell, per-screen topic subscriptions, reviewing indicator + heartbeat, reconnect/backfill. This is the phase to spend the most care on ([05](05-realtime.md) in full) — it's the highest-weighted requirement in the problem statement. Demoable: two browsers side by side (BE §11's own advice), one approver one developer, showing live "is reviewing," live approval notification, live new-message push.
8. **Dashboard aggregates** — swap any hand-rolled counts for `GET /api/dashboard`, add the stacked developer/approver sections.
9. **Polish pass** — empty states, skeletons, error banners per [09](09-error-handling.md), responsive layout check on the request detail two-column screen, accessibility pass (focus management in dialogs, keyboard nav on the notification bell).

## What NOT to build in this pass

- Anything in BE §10 (bonus): FCM push, in-browser file editor + version history, containerized execution + log viewer. If asked to prioritize bonus work, resurface [00-overview.md](00-overview.md)'s scope note before starting — those are explicitly deferred.
- A token-refresh flow — there isn't one in the contract (BE §2); don't invent one.
- Optimistic status updates on requests/releases — explicitly disallowed per [01-architecture.md](01-architecture.md)'s cross-cutting conventions, since decisions are atomic/first-write-wins server-side.
