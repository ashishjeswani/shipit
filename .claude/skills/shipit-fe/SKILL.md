---
name: shipit-fe
description: Build and extend the ShipIt deployment-approval portal frontend (Next.js 16 App Router) per the locked BE API contract and the FE design docs in docs/frontend/. Use for any FE work in this repo — new screens, hooks, API calls, realtime wiring, or reviewing FE changes for spec conformance.
---

# ShipIt FE build skill

This repo builds the frontend for a deployment-approval portal. The backend contract is fixed and lives at [`docs/BACKEND_API_GUIDE.md`](../../../docs/BACKEND_API_GUIDE.md) — treat it as read-only ground truth, never invent or guess an endpoint shape. The FE design decisions built on top of it live in [`docs/frontend/`](../../../docs/frontend/00-overview.md), one doc per concern. BE implementation itself is **out of scope** — never write Kotlin/Spring code from this skill.

## Before writing any FE code

1. Read [`docs/frontend/00-overview.md`](../../../docs/frontend/00-overview.md) for scope and tech-stack decisions.
2. Read the specific doc that covers what you're about to touch (table below) — don't re-derive a decision that's already written down, and don't silently contradict one; if a doc looks wrong given what you're building, say so and propose the edit rather than diverging quietly.
3. This repo runs **Next.js 16**, which has breaking changes vs. training-data Next.js conventions. Per [`AGENTS.md`](../../../AGENTS.md): read the relevant guide under `node_modules/next/dist/docs/` before writing App Router code (routing, data fetching, metadata, etc.) — do not assume Next 13/14 patterns still apply.

## Which doc covers what

| Touching... | Read first |
|---|---|
| Overall structure, a new top-level folder | [02-folder-structure.md](../../../docs/frontend/02-folder-structure.md) |
| A DTO / TypeScript type | [03-data-model.md](../../../docs/frontend/03-data-model.md) |
| A new `lib/api/*` call or hook | [04-api-endpoint-map.md](../../../docs/frontend/04-api-endpoint-map.md) — check whether the wrapper already exists before adding one |
| Anything WebSocket/STOMP, notifications, "is reviewing" | [05-realtime.md](../../../docs/frontend/05-realtime.md) |
| Query cache keys, Zustand stores, invalidation | [06-state-management.md](../../../docs/frontend/06-state-management.md) |
| Login, route protection, role/ownership checks | [07-auth-and-permissions.md](../../../docs/frontend/07-auth-and-permissions.md) |
| A screen/route, component placement | [08-ui-architecture.md](../../../docs/frontend/08-ui-architecture.md) |
| Error codes, toasts/banners, file download, validation limits | [09-error-handling.md](../../../docs/frontend/09-error-handling.md) |
| "What order should I build this in" | [10-build-plan.md](../../../docs/frontend/10-build-plan.md) |

## Non-negotiable rules (repeated across the docs because violating them breaks the demo, not just style)

- **`code`, never `message`, drives error-handling branches** (BE §0). `message` is copy, `code` is logic.
- **Permission checks are capability checks**, never identity checks — a user can hold both `DEVELOPER` and `APPROVER` at once. Route every gate through `lib/auth/capabilities.ts`, never an inline `.includes("APPROVER")`.
- **No self-review, ever** — `canReview` must check ownership before role, full stop. If you ever see review buttons rendered on a user's own request, that's a bug to fix immediately, not a UX case to design around.
- **WS is a cache-invalidation hint, REST is the source of truth** (BE §8 rule 2) — a WS event handler almost always ends in `queryClient.invalidateQueries(...)`, not a direct cache write. The one sanctioned exception is the ephemeral `reviewingBy` map in `realtime-store` ([06](../../../docs/frontend/06-state-management.md)).
- **No optimistic status transitions** on releases/requests — decisions are atomic/first-write-wins server-side; always wait for the REST response.
- **Bonus scope (BE §10 — in-browser file editor + versions, containerized execution) is out of scope** unless a human explicitly asks to pick it up. Don't drift into it opportunistically. **FCM + Pusher presence are in scope** when requested — see [05-realtime.md](../../../docs/frontend/05-realtime.md).

## Workflow for adding a feature

1. Confirm it's in scope (check [00-overview.md](../../../docs/frontend/00-overview.md) scope section + the "not building" list in [10-build-plan.md](../../../docs/frontend/10-build-plan.md)).
2. Add/extend types in `lib/types/api.ts` if the BE guide describes a shape not yet modeled ([03](../../../docs/frontend/03-data-model.md)).
3. Add the `lib/api/*` wrapper + entry in [04-api-endpoint-map.md](../../../docs/frontend/04-api-endpoint-map.md)'s table (keep the doc in sync with the code — it's the map humans and future sessions use to avoid duplicate wrappers).
4. Add the hook, following the existing `{ data, isLoading, error, ...mutations }` convention.
5. Wire realtime invalidation if the BE guide's event catalog (§8) fires an event relevant to this data ([05](../../../docs/frontend/05-realtime.md)).
6. Build the screen/component per [08-ui-architecture.md](../../../docs/frontend/08-ui-architecture.md)'s placement and gating rules.
7. Map every new error code the endpoint can return per [09-error-handling.md](../../../docs/frontend/09-error-handling.md)'s table — add a row if it's a new code.
8. If a design decision changes along the way, update the doc in the same change — these docs drift into fiction fast if edits happen only in code.
