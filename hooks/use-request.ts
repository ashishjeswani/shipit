"use client"

import { useQuery } from "@tanstack/react-query"

import { useAuth } from "@/hooks/use-auth"
import { useUsers } from "@/hooks/use-users"
import { enrichRequest } from "@/lib/api/enrich-request"
import { requestsApi } from "@/lib/api/requests"
import { readStorageCoords } from "@/lib/api/storage-coords"
import { keys } from "@/lib/query/keys"
import type { DeploymentRequestDetail } from "@/lib/types/api"

// GET /api/deployment-requests/{id} (BE §4). A missing id and a 404 both
// resolve to `data: undefined` — same shape a hidden draft must produce per
// BE §4/§9 (existence shouldn't leak), even though the live BE doesn't
// actually enforce draft-hiding yet.
export function useRequest(id: number): {
  data: DeploymentRequestDetail | undefined
  isLoading: boolean
  error: Error | null
} {
  const { user } = useAuth()
  const usersQuery = useUsers()
  const requestQuery = useQuery({
    queryKey: keys.request(id),
    queryFn: () => requestsApi.get(id),
    retry: false,
  })

  const usersById = new Map((usersQuery.data ?? []).map((u) => [u.id, u]))
  let data = requestQuery.data ? enrichRequest(requestQuery.data, usersById, user) : undefined

  // Merge Storage coords from create (sessionStorage / cache) onto the file —
  // live FileSummaryDto doesn't carry uuid, which Storage download needs.
  if (data?.file) {
    const coords = readStorageCoords(id)
    if (coords && !data.file.uuid) {
      data = {
        ...data,
        file: {
          ...data.file,
          uuid: coords.uuid,
          storageUserId: coords.storageUserId,
          storagePrefix: coords.storagePrefix,
        },
      }
    }
  }

  return {
    data,
    isLoading: requestQuery.isLoading || usersQuery.isLoading,
    error: requestQuery.error ?? usersQuery.error,
  }
}
