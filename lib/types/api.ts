import type { ReleaseStatus, RequestStatus, Role } from "@/lib/constants"

export interface UserSummary {
  id: number
  name: string
}

export interface User extends UserSummary {
  username: string
  roles: Role[]
}

// ---- Raw shapes returned by the live backend (lib/api/* only — see the
// swagger at /v3/api-docs, which has drifted from docs/BACKEND_API_GUIDE.md) ----

export interface ReleaseDto {
  id: number
  name: string
  description: string | null
  releaseStatus: ReleaseStatus
  requestCount: number
  createdAt: string
}

export interface DeploymentRequestDto {
  id: number
  releaseId: number
  title: string
  requestStatus: RequestStatus
  ownerId: number
  assignedReviewerId: number | null
  createdAt: string
}

// ---- FE-facing shapes consumed by hooks/components ----

// A 1:1 mirror of ReleaseDto with `releaseStatus` renamed to `status` for
// readability. The live backend doesn't return `createdBy`/`approvers`/
// `myRequestCount` (docs/BACKEND_API_GUIDE.md describes them, the deployed
// API doesn't produce them yet) — `myRequestCount` is instead computed
// client-side in use-releases.ts from the joined request list.
export interface Release {
  id: number
  name: string
  description: string | null
  status: ReleaseStatus
  requestCount: number
  createdAt: string
}

export interface RequestFile {
  name: string
  size: number
  language: "python" | "javascript" | "shell"
}

// Enriched, viewer-scoped projection of DeploymentRequestDto: ownerId/
// assignedReviewerId are resolved to UserSummary via the users list (the BE
// never embeds names), and locked/mine are computed client-side from the
// current pretend-auth user (lib/auth/capabilities.ts) since there's no real
// per-user session backing this pass. The BE's list and detail endpoints
// return the identical shape today (no detail-only fields), so one type
// covers both — kept as two names for prop-type compatibility with existing
// components.
export interface DeploymentRequestListItem {
  id: number
  releaseId: number
  title: string
  status: RequestStatus
  owner: UserSummary
  assignedReviewer: UserSummary | null
  locked: boolean
  reviewingBy: UserSummary | null // always null — no presence signal exists yet
  unreadMessages?: number
  mine?: boolean
  createdAt: string
}

// description/file/updatedAt aren't returned by the live backend yet
// (DeploymentRequestReadDto has neither field) — optional so the detail page
// renders "not available" instead of crashing on missing data.
export interface DeploymentRequestDetail extends DeploymentRequestListItem {
  release?: { id: number; name: string; status: ReleaseStatus }
  description?: string
  file?: RequestFile
  updatedAt?: string
}

export interface HistoryEntry {
  at: string
  by: UserSummary
  event: string
}

export interface ConversationMessage {
  id: number
  requestId: number
  sender: UserSummary | null
  text: string
  system: boolean
  createdAt: string
}

export interface DashboardResponse {
  roles: Role[]
  developer: { myRequests: Record<RequestStatus, number> } | null
  approver: { pendingReviews: number; assignedToMe: number } | null
}
