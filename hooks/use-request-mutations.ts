"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"

import { type CreateRequestInput, requestsApi } from "@/lib/api/requests"
import { keys } from "@/lib/query/keys"

export function useRequestMutations() {
  const queryClient = useQueryClient()
  const invalidateRequests = () => queryClient.invalidateQueries({ queryKey: keys.requests.list() })

  const create = useMutation({
    mutationFn: (input: CreateRequestInput) => requestsApi.create(input),
    onSuccess: invalidateRequests,
  })

  const updateTitle = useMutation({
    mutationFn: ({ id, title }: { id: number; title: string }) =>
      requestsApi.updateTitle(id, title),
    onSuccess: (_, { id }) => {
      invalidateRequests()
      queryClient.invalidateQueries({ queryKey: keys.request(id) })
    },
  })

  const remove = useMutation({
    mutationFn: (id: number) => requestsApi.remove(id),
    onSuccess: invalidateRequests,
  })

  return { create, updateTitle, remove }
}
