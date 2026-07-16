"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"

import { type CreateRequestInput, requestsApi } from "@/lib/api/requests"
import { rememberStorageCoords } from "@/lib/api/storage-coords"
import { keys } from "@/lib/query/keys"

export function useRequestMutations() {
  const queryClient = useQueryClient()
  const invalidateRequests = () => queryClient.invalidateQueries({ queryKey: keys.requests.list() })

  function invalidateOne(id: number) {
    invalidateRequests()
    queryClient.invalidateQueries({ queryKey: keys.request(id) })
    queryClient.invalidateQueries({ queryKey: ["releases"] })
  }

  const create = useMutation({
    mutationFn: (input: Omit<CreateRequestInput, "userId">) => requestsApi.create(input),
    onSuccess: invalidateRequests,
  })

  // Storage upload + multipart create with status=PENDING_APPROVAL (live BE).
  const createAndSubmit = useMutation({
    mutationFn: (input: CreateRequestInput) => requestsApi.createAndSubmit(input),
    onSuccess: (dto) => {
      if (dto.file?.uuid && dto.file.storageUserId) {
        rememberStorageCoords(dto.id, {
          uuid: dto.file.uuid,
          storageUserId: dto.file.storageUserId,
          storagePrefix: dto.file.storagePrefix,
        })
      }
      invalidateOne(dto.id)
    },
  })

  const submit = useMutation({
    mutationFn: (id: number) => requestsApi.submit(id),
    onSuccess: (_, id) => invalidateOne(id),
  })

  const updateTitle = useMutation({
    mutationFn: ({ id, title }: { id: number; title: string }) =>
      requestsApi.updateTitle(id, title),
    onSuccess: (_, { id }) => invalidateOne(id),
  })

  const remove = useMutation({
    mutationFn: (id: number) => requestsApi.remove(id),
    onSuccess: invalidateRequests,
  })

  return { create, createAndSubmit, submit, updateTitle, remove }
}
