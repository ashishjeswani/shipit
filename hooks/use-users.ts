"use client"

import { useQuery } from "@tanstack/react-query"

import { usersApi } from "@/lib/api/users"
import { keys } from "@/lib/query/keys"

// Backs display-name resolution for deployment requests when an older payload
// only sends bare ids, and powers approver pickers on create forms. The live
// BE now embeds UserSummary on requests (see lib/api/enrich-request.ts).
export function useUsers() {
  return useQuery({
    queryKey: keys.users(),
    queryFn: usersApi.list,
    staleTime: 60_000,
  })
}
