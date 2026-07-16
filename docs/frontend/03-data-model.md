# 03 — Data Model (FE types)

All types live in `lib/types/api.ts` (DTOs) and `lib/types/errors.ts` (error shape). These mirror BE response shapes exactly (BE §2–§8) — do not add fields the BE doesn't send, and do not rename fields for "consistency"; a 1:1 mirror keeps the API map in [04](04-api-endpoint-map.md) trustworthy.

## Enums (`lib/constants.ts`)

```ts
export const ROLES = ["DEVELOPER", "APPROVER"] as const
export type Role = (typeof ROLES)[number]

export const RELEASE_STATUSES = ["OPEN", "READY_FOR_DEPLOYMENT", "CLOSED"] as const
export type ReleaseStatus = (typeof RELEASE_STATUSES)[number]

export const REQUEST_STATUSES = [
  "DRAFT",
  "PENDING_APPROVAL",
  "CHANGES_REQUESTED",
  "APPROVED",
  "REJECTED",
] as const
export type RequestStatus = (typeof REQUEST_STATUSES)[number]

export const SCRIPT_EXTENSIONS = ["py", "js", "sh"] as const
export const MAX_SCRIPT_FILE_BYTES = 5 * 1024 * 1024 // BE §0 validation limits

export const FIELD_LIMITS = {
  releaseName: { min: 1, max: 100 },
  requestTitle: { min: 1, max: 150 },
  requestDescription: { min: 1, max: 5000 },
  messageText: { min: 1, max: 2000 },
} as const
```

## Core DTOs (`lib/types/api.ts`)

```ts
export interface UserSummary {
  id: number
  name: string
}

export interface User extends UserSummary {
  username: string
  roles: Role[]
}

export interface Release {
  id: number
  name: string
  description: string
  status: ReleaseStatus
  createdBy: UserSummary
  approvers: UserSummary[]
  requestCount: number
  myRequestCount?: number // present when caller holds DEVELOPER (BE §3)
  createdAt: string // ISO-8601 UTC
}

export interface RequestFile {
  name: string
  size: number
  language: "python" | "javascript" | "shell"
}

// Shape returned by GET /api/releases/{releaseId}/requests (BE §4 list)
export interface DeploymentRequestListItem {
  id: number
  title: string
  status: RequestStatus
  owner: UserSummary
  assignedReviewer: UserSummary | null
  locked: boolean // true = caller can't open (BE §4 locked semantics)
  reviewingBy: UserSummary | null
  unreadMessages?: number
  mine?: boolean // present for dual-role callers viewing their own request
  createdAt: string
}

// Shape returned by GET /api/requests/{id} (BE §4 detail) — superset of list item
export interface DeploymentRequestDetail extends Omit<DeploymentRequestListItem, "unreadMessages"> {
  releaseId: number
  release?: { id: number; name: string; status: ReleaseStatus }
  description: string
  file: RequestFile
  updatedAt: string
}

export interface HistoryEntry {
  at: string
  by: UserSummary
  event: string // "CREATED" | "SUBMITTED" | "CHANGES_REQUESTED" | "FILE_REPLACED" | "RESUBMITTED" | "APPROVED" | "REJECTED" | ...
}

export interface ConversationMessage {
  id: number
  requestId: number
  sender: UserSummary | null // null when system === true (BE §5)
  text: string
  system: boolean
  createdAt: string
}

export type NotificationType =
  | "RELEASE_CREATED"
  | "ADDED_AS_APPROVER"
  | "REQUEST_SUBMITTED"
  | "REQUEST_REVIEW_STARTED"
  | "REQUEST_REVIEW_STOPPED"
  | "REQUEST_APPROVED"
  | "REQUEST_REJECTED"
  | "REQUEST_CHANGES_REQUESTED"
  | "MESSAGE_CREATED"

export interface NotificationItem {
  id: number // monotonically increasing — backs the `since` backfill param (BE §7)
  type: NotificationType
  title: string
  message: string
  read: boolean
  payload: Record<string, unknown> // shape varies by `type`, see 04-api-endpoint-map.md
  createdAt: string
}

export interface DashboardResponse {
  roles: Role[]
  releases: Release[]
  developer: { myRequests: Record<RequestStatus, number> } | null
  approver: { pendingReviews: number; assignedToMe: number } | null
}

// POST .../review/start response (BE §4)
export interface ReviewingState {
  requestId: number
  reviewingBy: UserSummary | null
}
```

## WebSocket envelope (`lib/realtime/types.ts`)

```ts
export interface WsEnvelope<TPayload = unknown> {
  event: NotificationType
  timestamp: string
  actor: UserSummary
  payload: TPayload
}

// Per-event payload shapes, keyed by event name (BE §8 event catalog)
export interface RequestEventPayload {
  requestId: number
  releaseId: number
  title?: string
}

export interface ReviewStartedPayload extends RequestEventPayload {
  reviewingBy: UserSummary
}
```

## Error shape (`lib/types/errors.ts`)

```ts
export type ErrorCode =
  | "INVALID_CREDENTIALS"
  | "VALIDATION_FAILED"
  | "RELEASE_NOT_OPEN"
  | "RELEASE_HAS_OPEN_REQUESTS"
  | "REQUEST_LOCKED"
  | "REQUEST_NOT_EDITABLE"
  | "REQUEST_NOT_REVIEWABLE"
  | "REQUEST_ALREADY_DECIDED"
  | "NOT_RELEASE_APPROVER"
  | "SELF_REVIEW_FORBIDDEN"
  | "NOT_FOUND"

export interface ApiError {
  code: ErrorCode | (string & {}) // widen for forward-compat with new BE codes
  message: string
  status: number
  timestamp: string
}

// Thrown by lib/api/client.ts on any non-2xx response
export class ApiClientError extends Error {
  constructor(public readonly error: ApiError) {
    super(error.message)
  }
}
```

## Notes

- `DeploymentRequestListItem` and `DeploymentRequestDetail` are deliberately **separate types**, not one type with optional fields — the list endpoint never sends `description`/`file`, and rendering code should not have to guard against fields that are simply absent by contract. Fetch detail when you need detail.
- `payload` on `NotificationItem` stays loosely typed (`Record<string, unknown>`) since BE §7 doesn't pin its shape per type; narrow it at the call site with a small `payload as { requestId: number; releaseId: number }` cast where needed, not with a shared generic type.
- Every DTO field name is copied verbatim from the BE guide's JSON examples — if a response ever doesn't match, that's a contract drift to raise, not a client-side normalization to write around.
