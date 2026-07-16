"use client"

import { useQuery } from "@tanstack/react-query"

import { releasesApi } from "@/lib/api/releases"
import { keys } from "@/lib/query/keys"

// GET /api/releases/{id} (BE §3).
export function useRelease(id: number) {
  return useQuery({
    queryKey: keys.release(id),
    queryFn: () => releasesApi.get(id),
    retry: false,
  })
}
