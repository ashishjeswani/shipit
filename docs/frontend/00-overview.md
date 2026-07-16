# FE Design Spec — Index

This is the frontend implementation spec for the Deployment Approval Portal, built against the locked contract in [../BACKEND_API_GUIDE.md](../BACKEND_API_GUIDE.md) (referred to as "BE §n" throughout). BE is out of scope — these docs assume the contract is exactly as written there and design the FE to consume it.

Read in this order the first time; after that, jump to whichever doc matches the change you're making.

| Doc | Covers |
|---|---|
| [01-architecture.md](01-architecture.md) | System architecture, layers, tech stack, key decisions |
| [02-folder-structure.md](02-folder-structure.md) | Full repo tree and what lives where |
| [03-data-model.md](03-data-model.md) | TypeScript types mirroring BE DTOs/enums |
| [04-api-endpoint-map.md](04-api-endpoint-map.md) | Every BE endpoint → FE hook → consuming component |
| [05-realtime.md](05-realtime.md) | STOMP/WS client, topics, reconnect/backfill, reviewing-TTL heartbeat |
| [06-state-management.md](06-state-management.md) | TanStack Query cache + Zustand stores, invalidation rules |
| [07-auth-and-permissions.md](07-auth-and-permissions.md) | Token storage, route protection, capability guards |
| [08-ui-architecture.md](08-ui-architecture.md) | Routes, screens, component breakdown, role-aware rendering |
| [09-error-handling.md](09-error-handling.md) | Error code → UX mapping, validation, toast/banner conventions |
| [10-build-plan.md](10-build-plan.md) | Phased implementation order |

## Product scope (from the problem statement)

- Two roles, **held as a set per user** (BE §0): `DEVELOPER`, `APPROVER`. A user can hold both — FE must render the union of both dashboards for such a user, never assume one role per person.
- **Release**: created by an APPROVER, has status `OPEN` / `READY_FOR_DEPLOYMENT` / `CLOSED`, can have multiple approvers.
- **Deployment request**: created by a DEVELOPER against an OPEN release, carries a description + one script file (`.py`/`.js`/`.sh`), optionally restricted to one reviewer. Lifecycle: `DRAFT → PENDING_APPROVAL → APPROVED | REJECTED | CHANGES_REQUESTED → (resubmit) PENDING_APPROVAL`.
- Linear, text-only conversation per request.
- Real-time is a **first-class requirement**, not a nice-to-have: release creation, request submission, approve/reject/changes-requested, "X is reviewing", new messages — all pushed live.
- Bonuses (FCM push, in-browser file editor + versioning, containerized execution) are **explicitly out of scope** for this pass.

## Tech stack decisions

| Concern | Choice | Why |
|---|---|---|
| Framework | Next.js 16 (App Router), already scaffolded | Existing repo baseline. **Next 16 has breaking changes vs. training-data Next.js — read `node_modules/next/dist/docs/` before writing App Router code** (per [AGENTS.md](../../AGENTS.md)). |
| UI kit | shadcn/ui (`base-maia` style, zinc base), already scaffolded | Already wired via `components.json`; add primitives with `npx shadcn@latest add <name>` as needed. |
| Server-state cache | TanStack Query v5 | REST is the source of truth per BE §8 reliability rule 2 — Query's cache + `invalidateQueries` is exactly the "WS is a hint, REST is truth" model. |
| Ephemeral client state | Zustand | Auth session + the live `reviewingBy` map and WS connection status don't belong in the server-state cache; see [06](06-state-management.md). |
| Realtime transport | STOMP over WebSocket via `@stomp/stompjs`, SockJS fallback via `sockjs-client` | Matches BE §8 exactly — this isn't a choice, it's what the BE speaks. |
| Forms | `react-hook-form` + `zod` (`@hookform/resolvers`) | Client-side mirrors of BE §0 validation limits, fast feedback before the multipart round-trip. |
| Data fetching transport | native `fetch` wrapped in `lib/api/client.ts` | No need for axios; one small wrapper handles the `Authorization` header, JSON vs multipart, and BE §0 error shape. |
| Auth token storage | Non-httpOnly cookie (`shipit_token`) | See [07-auth-and-permissions.md](07-auth-and-permissions.md) for the full rationale — the token must be readable by JS (STOMP CONNECT header, fetch Authorization header), but a cookie still lets `middleware.ts` do a cheap presence check for redirects. |

## Key assumptions (flag if wrong)

1. Single BE origin for both REST and WS, configured via `NEXT_PUBLIC_API_BASE_URL` (default `http://localhost:8080`) and `NEXT_PUBLIC_WS_URL` (default derived as `{base}/ws`).
2. No token refresh flow exists (BE §2 issues one token at login, hackathon scope) — FE treats a `401` anywhere as "session expired," clears the token, and redirects to `/login`. No silent refresh to build.
3. CORS is permitted from the FE origin to `localhost:8080` in dev; not an FE concern beyond setting `credentials`/headers correctly.
4. Notification `id`s are monotonically increasing per BE §7 — FE relies on this for the `since` backfill parameter.
