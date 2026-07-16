"use client"

import { QueryClient } from "@tanstack/react-query"

// STOMP realtime for releases/requests/messages still isn't built (only the
// notification bell has a — non-functional pending BE support — Pusher hook,
// see docs/frontend/04-api-endpoint-map.md), so staleTime stays short and
// refetch-on-focus stays on to keep lists reasonably fresh in the meantime.
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
