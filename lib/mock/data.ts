import type {
  DashboardResponse,
  DeploymentRequestListItem,
  Release,
  User,
} from "@/lib/types/api"
import type { RequestStatus } from "@/lib/constants"
import { REQUEST_STATUSES } from "@/lib/constants"

// Standalone mock substrate for the FE-only pass (no BE running yet).
// Shapes mirror lib/types/api.ts exactly so swapping to real lib/api/*
// calls later only touches hooks, not components.

export const mockUsers: User[] = [
  { id: 1, name: "Alice Nguyen", username: "alice", roles: ["APPROVER"] },
  { id: 2, name: "Bob Okafor", username: "bob", roles: ["APPROVER"] },
  { id: 3, name: "Carol Mendes", username: "carol", roles: ["DEVELOPER"] },
  { id: 4, name: "Dave Kessler", username: "dave", roles: ["DEVELOPER", "APPROVER"] },
]

const alice = mockUsers[0]
const bob = mockUsers[1]
const carol = mockUsers[2]
const dave = mockUsers[3]

export const mockReleases: Release[] = [
  {
    id: 101,
    name: "2026.07 — Sprint 42",
    description: "Post-deploy scripts for the sprint 42 feature set.",
    status: "OPEN",
    createdBy: alice,
    approvers: [alice, bob],
    requestCount: 3,
    createdAt: "2026-07-14T09:12:00Z",
  },
  {
    id: 102,
    name: "2026.06 — Sprint 41",
    description: "Billing migration follow-up scripts.",
    status: "READY_FOR_DEPLOYMENT",
    createdBy: dave,
    approvers: [alice, dave],
    requestCount: 5,
    createdAt: "2026-06-30T14:45:00Z",
  },
  {
    id: 103,
    name: "2026.05 — Sprint 40",
    description: "Data backfill for the reporting service.",
    status: "CLOSED",
    createdBy: bob,
    approvers: [bob],
    requestCount: 2,
    createdAt: "2026-05-20T11:00:00Z",
  },
]

// GET /api/releases/{releaseId}/requests (BE §4 list) across all releases
export const mockRequests: DeploymentRequestListItem[] = [
  {
    id: 1001,
    title: "Backfill customer region column",
    status: "PENDING_APPROVAL",
    owner: carol,
    assignedReviewer: null,
    locked: false,
    reviewingBy: null,
    unreadMessages: 1,
    createdAt: "2026-07-15T10:00:00Z",
  },
  {
    id: 1002,
    title: "Purge stale session rows",
    status: "PENDING_APPROVAL",
    owner: dave,
    assignedReviewer: alice,
    locked: true,
    reviewingBy: null,
    createdAt: "2026-07-15T08:30:00Z",
  },
  {
    id: 1003,
    title: "Reindex search catalog",
    status: "DRAFT",
    owner: carol,
    assignedReviewer: null,
    locked: false,
    reviewingBy: null,
    createdAt: "2026-07-16T07:00:00Z",
  },
  {
    id: 1004,
    title: "Rotate billing webhook secret",
    status: "CHANGES_REQUESTED",
    owner: dave,
    assignedReviewer: null,
    locked: false,
    reviewingBy: null,
    unreadMessages: 2,
    createdAt: "2026-06-29T16:20:00Z",
  },
  {
    id: 1005,
    title: "Migrate invoice PDFs to new bucket",
    status: "APPROVED",
    owner: carol,
    assignedReviewer: bob,
    locked: false,
    reviewingBy: null,
    createdAt: "2026-06-28T12:00:00Z",
  },
  {
    id: 1006,
    title: "Drop deprecated feature-flag table",
    status: "PENDING_APPROVAL",
    owner: dave,
    assignedReviewer: null,
    locked: false,
    reviewingBy: alice,
    createdAt: "2026-07-15T13:10:00Z",
  },
  {
    id: 1007,
    title: "One-off refund reconciliation script",
    status: "REJECTED",
    owner: carol,
    assignedReviewer: null,
    locked: false,
    reviewingBy: null,
    createdAt: "2026-05-19T09:45:00Z",
  },
  {
    id: 1008,
    title: "Rebuild materialized view for analytics",
    status: "APPROVED",
    owner: dave,
    assignedReviewer: bob,
    locked: false,
    reviewingBy: null,
    createdAt: "2026-06-27T10:15:00Z",
  },
  {
    id: 1009,
    title: "Feature-flag cleanup script",
    status: "DRAFT",
    owner: carol,
    assignedReviewer: null,
    locked: false,
    reviewingBy: null,
    createdAt: "2026-06-26T09:00:00Z",
  },
  {
    id: 1010,
    title: "Reconcile Q1 close entries",
    status: "APPROVED",
    owner: carol,
    assignedReviewer: null,
    locked: false,
    reviewingBy: null,
    createdAt: "2026-05-18T15:30:00Z",
  },
]

const releaseIdByRequestId: Record<number, number> = {
  1001: 101,
  1002: 101,
  1003: 101,
  1004: 102,
  1005: 102,
  1006: 102,
  1007: 103,
  1008: 102,
  1009: 102,
  1010: 103,
}

// GET /api/releases/{releaseId}/requests (BE §4 list) — unfiltered by role;
// callers apply the developer/approver visibility rule themselves.
export function getMockRequestsForRelease(releaseId: number): DeploymentRequestListItem[] {
  return mockRequests.filter((request) => releaseIdByRequestId[request.id] === releaseId)
}

function emptyStatusCounts(): Record<RequestStatus, number> {
  return Object.fromEntries(REQUEST_STATUSES.map((status) => [status, 0])) as Record<
    RequestStatus,
    number
  >
}

export function getMockDashboard(user: User): DashboardResponse {
  const isDeveloper = user.roles.includes("DEVELOPER")
  const isApprover = user.roles.includes("APPROVER")

  const developer = isDeveloper
    ? {
        myRequests: mockRequests
          .filter((request) => request.owner.id === user.id)
          .reduce((counts, request) => {
            counts[request.status] += 1
            return counts
          }, emptyStatusCounts()),
      }
    : null

  const releasesUserApproves = new Set(
    mockReleases
      .filter((release) => release.approvers.some((approver) => approver.id === user.id))
      .map((release) => release.id)
  )

  const approver = isApprover
    ? {
        pendingReviews: mockRequests.filter(
          (request) =>
            request.status === "PENDING_APPROVAL" &&
            !request.locked &&
            releasesUserApproves.has(releaseIdByRequestId[request.id])
        ).length,
        assignedToMe: mockRequests.filter(
          (request) =>
            request.status === "PENDING_APPROVAL" && request.assignedReviewer?.id === user.id
        ).length,
      }
    : null

  const releases = isDeveloper
    ? mockReleases.map((release) => ({
        ...release,
        myRequestCount: mockRequests.filter(
          (request) =>
            request.owner.id === user.id && releaseIdByRequestId[request.id] === release.id
        ).length,
      }))
    : mockReleases

  return {
    roles: user.roles,
    releases,
    developer,
    approver,
  }
}
