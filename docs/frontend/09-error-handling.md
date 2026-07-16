# 09 — Error Handling & Validation

## Rule zero

Never branch UI logic on `error.message` (BE §0 explicitly calls this out — message is for humans, `code` is for FE). All error handling keys off `ApiError.code`.

## `lib/api/client.ts` contract

Every wrapped call either resolves with typed data or throws `ApiClientError` (see [03](03-data-model.md)). Callers never see raw `Response` objects or unwrap JSON themselves — that's the client's job, once, in one place.

```ts
async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: { ...authHeader(), ...init?.headers },
  })
  if (res.status === 204) return undefined as T
  const body = await res.json()
  if (!res.ok) {
    if (res.status === 401) { clearSession(); redirectToLogin(); }
    throw new ApiClientError(body as ApiError)
  }
  return body as T
}
```

Multipart requests (`requests.create`, `requests.replaceFile`) use a sibling `requestMultipart` that omits the `Content-Type` header (let the browser set the boundary) but shares the same error handling tail.

## Error code → UX mapping

| Code | HTTP | Where it can occur | FE treatment |
|---|---|---|---|
| `INVALID_CREDENTIALS` | 401 | Login | Inline form error under the password field. |
| `VALIDATION_FAILED` | 400 | Create/edit release or request, file upload | Should be **rare** in practice — zod mirrors every BE limit ([03](03-data-model.md) `FIELD_LIMITS`, `SCRIPT_EXTENSIONS`, `MAX_SCRIPT_FILE_BYTES`) so this fires client-side first. If it still reaches the BE (e.g. a stale client), show `message` verbatim in a form-level alert — it's the one case where showing raw BE `message` is correct, since it's a validation detail, not a branching decision. |
| `RELEASE_NOT_OPEN` | 409 | Create/submit request | Toast: "This release is no longer open for new requests." Redirect back to the release page (its status has since changed — invalidate `keys.release(id)` so the badge reflects it). |
| `RELEASE_HAS_OPEN_REQUESTS` | 409 | Release status → READY_FOR_DEPLOYMENT | Inline alert on the status menu: "Some requests are still pending — resolve them first," and (nice-to-have) link/scroll to the offending requests via the already-loaded list (filter client-side for non-terminal statuses; no extra endpoint needed). |
| `REQUEST_LOCKED` | 403 | Opening a request | Replace the whole detail body with `locked-banner.tsx` showing `message` verbatim (BE already writes the friendly "restricted to X" copy — don't re-derive it). |
| `REQUEST_NOT_EDITABLE` | 409 | Edit/replace-file on a non-draft/non-changes-requested request | Shouldn't be reachable — `canEditRequest` hides the form. If hit anyway (stale tab), toast + invalidate `keys.request(id)` to snap the UI to current status. |
| `REQUEST_NOT_REVIEWABLE` | 409 | Approve/reject/request-changes | Same pattern: `canReview` should have hidden the buttons; treat as a stale-state race, toast "This request's status changed" + invalidate. |
| `REQUEST_ALREADY_DECIDED` | 409 | Approve/reject/request-changes, concurrent approvers | Toast: "Someone else just decided on this request" + invalidate `keys.request(id)` so the now-terminal status renders. This is an **expected, demoable race**, not a bug — phrase the toast accordingly, not as a scary error. |
| `NOT_RELEASE_APPROVER` | 403 | Release status/approver actions, review actions | Shouldn't be reachable via UI gating; toast generic "You don't have permission for this" if hit. |
| `SELF_REVIEW_FORBIDDEN` | 403 | Review actions on own request | Shouldn't be reachable — `canReview`'s ownership check is first in line specifically to prevent this. Treat any occurrence as a **capability-guard bug to fix**, not a case to design a toast for. |
| `NOT_FOUND` | 404 | Opening another developer's draft, bad IDs | Generic "not found" screen — must look **identical** whether the resource never existed or exists-but-is-a-hidden-draft (BE §4: drafts must not leak existence via a different error shape, and FE must not accidentally leak it either via different copy/behavior). |

## Toasts vs inline vs banners — when to use which

- **Inline field errors** (react-hook-form + zod): client-side validation, and the rare BE `VALIDATION_FAILED` echo.
- **Banners** (persistent, in-flow): errors that describe the *state of the resource being viewed* — `REQUEST_LOCKED`, `RELEASE_HAS_OPEN_REQUESTS`. These aren't transient; they belong in the layout, not a toast that disappears.
- **Toasts** (`sonner`, transient): errors/confirmations about an *action just taken* — approve succeeded, decision race lost, generic permission denial. Also used for realtime notifications ([05](05-realtime.md)).

## File download (no auth header on a plain `<a href>`)

`GET /api/requests/{id}/file` requires the `Authorization` header, which a bare anchor tag can't send. Pattern for `file-download-button.tsx`:

```ts
async function downloadRequestFile(id: number, filename: string) {
  const res = await fetch(`${API_BASE}/api/requests/${id}/file`, { headers: authHeader() })
  if (!res.ok) throw new ApiClientError(await res.json())
  const blob = await res.blob()
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename // from RequestFile.name (BE §4) — BE already sanitizes Content-Disposition
  a.click()
  URL.revokeObjectURL(url)
}
```

This bypasses `lib/api/client.ts`'s JSON assumption (response is binary) — implemented directly in `requests.downloadFile`, not forced through the generic `request<T>()` helper. Not cached in TanStack Query — it's a one-shot side effect, not state to hold onto.

## Client-side validation limits (mirror of BE §0 — keep these two tables in sync)

| Field | Limit | Enforced in |
|---|---|---|
| release `name` | 1–100 chars | `create-release-dialog.tsx` zod schema |
| request `title` | 1–150 chars | `create-request-form.tsx` / `edit-request-form.tsx` zod schema |
| request `description` | 1–5000 chars | same |
| message `text` | 1–2000 chars | `message-composer.tsx` zod schema |
| script file | ext `py`/`js`/`sh`, ≤ 5MB | `create-request-form.tsx` file input `accept` + zod `refine` |
