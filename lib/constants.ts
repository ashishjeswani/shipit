export const ROLES = ["DEVELOPER", "APPROVER"] as const
export type Role = (typeof ROLES)[number]

export const RELEASE_STATUSES = ["OPEN", "READY_FOR_DEPLOYMENT", "CLOSED"] as const
export type ReleaseStatus = (typeof RELEASE_STATUSES)[number]

// PENDING_REVIEW (not PENDING_APPROVAL) confirmed against the live backend's
// seed data on 2026-07-16 — the deployed requestStatus enum has drifted from
// docs/BACKEND_API_GUIDE.md; the terminal statuses are unconfirmed best guesses
// since no lifecycle endpoint exists yet to produce them.
export const REQUEST_STATUSES = [
  "DRAFT",
  "PENDING_REVIEW",
  "CHANGES_REQUESTED",
  "APPROVED",
  "REJECTED",
] as const
export type RequestStatus = (typeof REQUEST_STATUSES)[number]

export const FIELD_LIMITS = {
  messageText: { min: 1, max: 2000 },
  releaseName: { min: 1, max: 100 },
  requestTitle: { min: 1, max: 150 },
  requestDescription: { min: 1, max: 5000 },
} as const

// The live backend requires a bearer token but has no usable login flow for
// this pass (docs/frontend/07-auth-and-permissions.md's login UI is out of
// scope here) — see lib/auth/token.ts for the silent bootstrap this backs.
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "https://hackathon-backend-948a.onrender.com"
