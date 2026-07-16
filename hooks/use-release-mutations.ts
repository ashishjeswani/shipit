"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"

import { type CreateReleaseInput, releasesApi } from "@/lib/api/releases"
import type { ReleaseStatus } from "@/lib/constants"
import { keys } from "@/lib/query/keys"

export function useReleaseMutations() {
  const queryClient = useQueryClient()
  const invalidateReleases = () => queryClient.invalidateQueries({ queryKey: ["releases"] })

  const create = useMutation({
    mutationFn: (input: CreateReleaseInput) => releasesApi.create(input),
    onSuccess: invalidateReleases,
  })

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: number; status: ReleaseStatus }) =>
      releasesApi.updateStatus(id, status),
    onSuccess: (_, { id }) => {
      invalidateReleases()
      queryClient.invalidateQueries({ queryKey: keys.release(id) })
    },
  })

  return { create, updateStatus }
}
