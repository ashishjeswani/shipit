import type { ReleaseStatus } from "@/lib/constants"

// Single source of truth for cache keys — mutations and hooks both import
// from here so invalidation can never drift from what a query actually used.
export const keys = {
  users: () => ["users"] as const,
  releases: {
    list: (status?: ReleaseStatus) => ["releases", { status }] as const,
  },
  release: (id: number) => ["releases", id] as const,
  requests: {
    list: () => ["requests"] as const,
  },
  request: (id: number) => ["requests", id] as const,
  requestHistory: (id: number) => ["requests", id, "history"] as const,
  requestMessages: (id: number) => ["requests", id, "messages"] as const,
  notifications: {
    list: () => ["notifications"] as const,
    unreadCount: () => ["notifications", "unread-count"] as const,
  },
}
