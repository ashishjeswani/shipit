"use client"

import { useQuery } from "@tanstack/react-query"

import { useAuth } from "@/hooks/use-auth"
import { useUsers } from "@/hooks/use-users"
import { enrichRequest } from "@/lib/api/enrich-request"
import { requestsApi } from "@/lib/api/requests"
import { keys } from "@/lib/query/keys"
import type { DeploymentRequestListItem } from "@/lib/types/api"

// GET /api/deployment-requests (BE §4) — the live endpoint has no releaseId
// filter and returns every request regardless of owner (no draft-hiding
// interceptor exists yet), so callers that need per-release or per-owner
// scoping filter this list client-side (see use-releases.ts).
export function useRequests(): {
  data: DeploymentRequestListItem[]
  isLoading: boolean
  error: Error | null
} {
  const { user } = useAuth()
  const usersQuery = useUsers()
  const requestsQuery = useQuery({
    queryKey: keys.requests.list(),
    queryFn: requestsApi.list,
  })

  const usersById = new Map((usersQuery.data ?? []).map((u) => [u.id, u]))
  const data = (requestsQuery.data ?? []).map((dto) => enrichRequest(dto, usersById, user))

  return {
    data,
    isLoading: requestsQuery.isLoading || usersQuery.isLoading,
    error: requestsQuery.error ?? usersQuery.error,
  }
}
