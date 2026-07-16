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
  // Field-name drift: older payloads used `releaseStatus`; live swagger
  // (ReleaseReadDto) serializes `status`. Accept both and let fromDto coalesce.
  releaseStatus?: ReleaseStatus
  status?: ReleaseStatus
  createdBy?: UserSummary | null
  approvers?: UserSummary[]
  requestCount: number
  myRequestCount?: number | null
  createdAt: string
}

// Mirrors live DeploymentRequestReadDto (/v3/api-docs). Older smoke-tested
// payloads used bare ownerId/assignedReviewerId + requestStatus — keep those
// optional so enrich-request can still resolve either shape.
export interface DeploymentRequestDto {
  id: number
  releaseId: number
  title: string
  description?: string
  status?: RequestStatus
  requestStatus?: RequestStatus
  owner?: UserSummary | null
  assignedReviewer?: UserSummary | null
  ownerId?: number
  assignedReviewerId?: number | null
  file?: RequestFile | null
  reviewingBy?: UserSummary | null
  locked?: boolean
  unreadMessages?: number
  createdAt: string
  updatedAt?: string
}

// ---- FE-facing shapes consumed by hooks/components ----

// A 1:1 mirror of ReleaseDto with `releaseStatus` renamed to `status` for
// readability. `myRequestCount` is preferred from the BE when present;
// otherwise use-releases.ts fills it client-side from the joined request list.
export interface Release {
  id: number
  name: string
  description: string | null
  status: ReleaseStatus
  createdBy?: UserSummary | null
  approvers?: UserSummary[]
  requestCount: number
  myRequestCount?: number
  createdAt: string
}

export interface RequestFile {
  name: string
  size: number
  language: "python" | "javascript" | "shell"
  // Attached client-side after POST /api/v1/storage/upload — the live
  // FileSummaryDto doesn't return these, but Storage download needs them.
  uuid?: string
  storageUserId?: string
  storagePrefix?: string
}

// Enriched, viewer-scoped projection of DeploymentRequestDto: embedded
// owner/assignedReviewer (or bare ids on older payloads) are normalized to
// UserSummary, and locked/mine are filled from the BE when present or
// computed client-side (lib/auth/capabilities.ts). List and detail share one
// enrich path — detail-only fields stay optional on the detail type.
export interface DeploymentRequestListItem {
  id: number
  releaseId: number
  title: string
  status: RequestStatus
  owner: UserSummary
  assignedReviewer: UserSummary | null
  locked: boolean
  reviewingBy: UserSummary | null
  unreadMessages?: number
  mine?: boolean
  createdAt: string
}

// description/file/updatedAt are present on live DeploymentRequestReadDto;
// optional so older payloads still render without crashing.
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

// Live MessageEntity (/v3/api-docs Conversations) — sender is a bare id;
// FE enriches to UserSummary in use-request-messages. Guide §5's embedded
// `sender` is accepted when present so either shape works.
export interface MessageDto {
  id: number
  requestId: number
  senderId?: number | null
  sender?: UserSummary | null
  text: string
  system: boolean
  status?: "ACTIVE" | "DELETED"
  createdAt: string
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

// Live NotificationReadDto has type/payload/read — title/message are derived
// in lib/api/enrich-notification.ts for the bell + toasts.
export interface Notification {
  id: number
  type: string
  title: string
  message: string
  read: boolean
  payload: Record<string, unknown>
  createdAt: string
  eventId?: number
}
