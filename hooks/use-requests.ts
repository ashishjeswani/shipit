import { useMemo } from "react"

import { getMockRequestsForRelease } from "@/lib/mock/data"
import { useAuthStore } from "@/stores/auth-store"

// GET /api/releases/{releaseId}/requests (BE §4 list). Mock-backed for now —
// mirrors BE role-aware visibility: an APPROVER sees every request (tagged
// `mine`), a DEVELOPER-only caller sees just their own.
export function useRequests(releaseId: number) {
  const currentUser = useAuthStore((state) => state.currentUser)

  const data = useMemo(() => {
    const all = getMockRequestsForRelease(releaseId)
    const isApprover = currentUser.roles.includes("APPROVER")

    if (isApprover) {
      return all.map((request) => ({ ...request, mine: request.owner.id === currentUser.id }))
    }

    return all.filter((request) => request.owner.id === currentUser.id)
  }, [releaseId, currentUser])

  return { data, isLoading: false, error: null }
}
