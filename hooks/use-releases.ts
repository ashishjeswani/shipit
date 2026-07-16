"use client"

import { useQuery } from "@tanstack/react-query"

import { useRequests } from "@/hooks/use-requests"
import { releasesApi } from "@/lib/api/releases"
import { keys } from "@/lib/query/keys"
import type { DeploymentRequestListItem, Release } from "@/lib/types/api"

export interface ReleaseWithRequests {
  release: Release
  requests: DeploymentRequestListItem[]
}

// GET /api/releases (BE §3) joined against GET /api/deployment-requests —
// the live release DTO has no embedded request list, and there's no
// releaseId filter on the requests endpoint, so the join happens here.
export function useReleases(): {
  data: ReleaseWithRequests[]
  isLoading: boolean
  error: Error | null
} {
  const releasesQuery = useQuery({ queryKey: keys.releases.list(), queryFn: releasesApi.list })
  const { data: requests, isLoading: requestsLoading, error: requestsError } = useRequests()

  const data: ReleaseWithRequests[] = (releasesQuery.data ?? []).map((release) => ({
    release,
    requests: requests.filter((request) => request.releaseId === release.id),
  }))

  return {
    data,
    isLoading: releasesQuery.isLoading || requestsLoading,
    error: releasesQuery.error ?? requestsError,
  }
}
