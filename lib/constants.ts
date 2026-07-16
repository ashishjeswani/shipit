export const ROLES = ["DEVELOPER", "APPROVER"] as const
export type Role = (typeof ROLES)[number]

export const RELEASE_STATUSES = ["OPEN", "READY_FOR_DEPLOYMENT", "CLOSED"] as const
export type ReleaseStatus = (typeof RELEASE_STATUSES)[number]

// Live BE/swagger uses PENDING_APPROVAL; older payloads used PENDING_REVIEW.
// Both are reviewable — normalize to PENDING_REVIEW in enrich-request so the
// rest of the UI speaks one vocabulary.
export const REQUEST_STATUSES = [
  "DRAFT",
  "PENDING_REVIEW",
  "CHANGES_REQUESTED",
  "APPROVED",
  "REJECTED",
] as const
export type RequestStatus = (typeof REQUEST_STATUSES)[number]

/** Raw BE statuses that mean "awaiting an approver decision". */
export const REVIEWABLE_RAW_STATUSES = ["PENDING_REVIEW", "PENDING_APPROVAL"] as const

export const FIELD_LIMITS = {
  messageText: { min: 1, max: 2000 },
  releaseName: { min: 1, max: 100 },
  requestTitle: { min: 1, max: 150 },
  requestDescription: { min: 1, max: 5000 },
} as const

// Live BE + Storage upload validation (BE §0 / swagger Storage).
export const SCRIPT_EXTENSIONS = ["py", "js", "sh"] as const
export type ScriptExtension = (typeof SCRIPT_EXTENSIONS)[number]
export const MAX_SCRIPT_FILE_BYTES = 5 * 1024 * 1024

export const SCRIPT_LANGUAGE_BY_EXT: Record<
  ScriptExtension,
  "python" | "javascript" | "shell"
> = {
  py: "python",
  js: "javascript",
  sh: "shell",
}

// The live backend requires a bearer token but has no usable login flow for
// this pass (docs/frontend/07-auth-and-permissions.md's login UI is out of
// scope here) — see lib/auth/token.ts for the silent bootstrap this backs.
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "https://hackathon-backend-948a.onrender.com"

// The live backend's realtime layer is STOMP/WebSocket only (BE §8) — it has
// no Pusher auth endpoint and never publishes to Pusher. These are wired per
// an explicit, out-of-contract request (lib/realtime/pusher-client.ts); left
// unset, the notification bell just runs on REST alone with no live push.
export const PUSHER_KEY = process.env.NEXT_PUBLIC_PUSHER_KEY ?? ""
export const PUSHER_CLUSTER = process.env.NEXT_PUBLIC_PUSHER_CLUSTER ?? "eu"
