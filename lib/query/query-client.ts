"use client"

import { QueryClient } from "@tanstack/react-query"

// No realtime layer yet (WS/notifications are out of scope for this pass), so
// staleTime is short and refetch-on-focus stays on — that's the only thing
// keeping lists fresh after a mutation elsewhere until BE lifecycle endpoints
// and WS land (docs/frontend/06-state-management.md).
export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 10_000,
        refetchOnWindowFocus: true,
        retry: 1,
      },
    },
  })
}
