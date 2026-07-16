import { create } from "zustand"

import type { UserSummary } from "@/lib/types/api"

interface RealtimeState {
  connectionStatus: "connecting" | "open" | "closed"
  /** Ephemeral "X is reviewing" map — written from Pusher presence events only. */
  reviewingBy: Record<number, UserSummary | undefined>
  lastSeenNotificationId: number
  setConnectionStatus: (status: RealtimeState["connectionStatus"]) => void
  setReviewing: (requestId: number, by: UserSummary | null) => void
  bumpLastSeen: (id: number) => void
}

export const useRealtimeStore = create<RealtimeState>((set) => ({
  connectionStatus: "closed",
  reviewingBy: {},
  lastSeenNotificationId: 0,
  setConnectionStatus: (connectionStatus) => set({ connectionStatus }),
  setReviewing: (requestId, by) =>
    set((state) => {
      const next = { ...state.reviewingBy }
      if (by) next[requestId] = by
      else delete next[requestId]
      return { reviewingBy: next }
    }),
  bumpLastSeen: (id) =>
    set((state) => ({
      lastSeenNotificationId: Math.max(state.lastSeenNotificationId, id),
    })),
}))
