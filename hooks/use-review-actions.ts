"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"

import { requestsApi } from "@/lib/api/requests"
import { keys } from "@/lib/query/keys"

// Approve / reject / request-changes — no optimistic status flip (BE §4
// decisions are atomic/first-write-wins; wait for the REST response).
export function useReviewActions() {
  const queryClient = useQueryClient()

  function invalidate(id: number) {
    queryClient.invalidateQueries({ queryKey: keys.request(id) })
    queryClient.invalidateQueries({ queryKey: keys.requests.list() })
    queryClient.invalidateQueries({ queryKey: ["releases"] })
  }

  const approve = useMutation({
    mutationFn: ({ id, comment }: { id: number; comment?: string }) =>
      requestsApi.approve(id, comment),
    onSuccess: (_, { id }) => invalidate(id),
  })

  const reject = useMutation({
    mutationFn: ({ id, comment }: { id: number; comment?: string }) =>
      requestsApi.reject(id, comment),
    onSuccess: (_, { id }) => invalidate(id),
  })

  const requestChanges = useMutation({
    mutationFn: ({ id, comment }: { id: number; comment: string }) =>
      requestsApi.requestChanges(id, comment),
    onSuccess: (_, { id }) => invalidate(id),
  })

  return { approve, reject, requestChanges }
}
