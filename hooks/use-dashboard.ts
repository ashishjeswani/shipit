"use client"

import { useAuth } from "@/hooks/use-auth"
import { useRequests } from "@/hooks/use-requests"
import { hasRole } from "@/lib/auth/capabilities"
import { REQUEST_STATUSES, type RequestStatus } from "@/lib/constants"
import type { DashboardResponse } from "@/lib/types/api"

// No GET /api/dashboard exists on the live backend (confirmed against the
// swagger on 2026-07-16) — derived client-side from the already-fetched
// requests list rather than a dedicated aggregate endpoint.
export function useDashboard(): {
  data: DashboardResponse
  isLoading: boolean
  error: Error | null
} {
  const { user } = useAuth()
  const { data: requests, isLoading, error } = useRequests()

  const myRequests = requests.filter((request) => request.mine)
  // `pendingReviews`/`assignedToMe` exclude the caller's own requests — BE §6:
  // you can never review those (SELF_REVIEW_FORBIDDEN), so counting them is noise.
  const reviewable = requests.filter((request) => !request.mine)

  const data: DashboardResponse = {
    roles: user?.roles ?? [],
    developer: hasRole(user, "DEVELOPER")
      ? {
          myRequests: Object.fromEntries(
            REQUEST_STATUSES.map((status) => [
              status,
              myRequests.filter((request) => request.status === status).length,
            ]),
          ) as Record<RequestStatus, number>,
        }
      : null,
    approver: hasRole(user, "APPROVER")
      ? {
          pendingReviews: reviewable.filter((request) => request.status === "PENDING_REVIEW").length,
          assignedToMe: reviewable.filter((request) => request.assignedReviewer?.id === user?.id)
            .length,
        }
      : null,
  }

  return { data, isLoading, error }
}
