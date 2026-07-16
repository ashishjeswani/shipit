"use client"

import { useQuery } from "@tanstack/react-query"

import { usersApi } from "@/lib/api/users"
import { keys } from "@/lib/query/keys"

// Backs ownerId/assignedReviewerId -> display-name resolution for deployment
// requests (BE never embeds user objects, see lib/api/enrich-request.ts).
export function useUsers() {
  return useQuery({
    queryKey: keys.users(),
    queryFn: usersApi.list,
    staleTime: 60_000,
  })
}
