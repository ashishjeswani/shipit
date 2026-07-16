import type { ReleaseStatus, RequestStatus, Role } from "@/lib/constants"

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
  myRequestCount?: number
  createdAt: string
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
  locked: boolean
  reviewingBy: UserSummary | null
  unreadMessages?: number
  mine?: boolean
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
  id: number
  type: NotificationType
  title: string
  message: string
  read: boolean
  payload: Record<string, unknown>
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
