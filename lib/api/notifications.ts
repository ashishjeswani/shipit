import { apiClient } from "@/lib/api/client"
import type { Notification } from "@/lib/types/api"

export const notificationsApi = {
  // `since` is the WS-reconnect backfill param (BE §7/§8) — omitted for a
  // plain list load, passed with the last-seen id after a reconnect.
  list: (since?: number) =>
    apiClient.get<Notification[]>(
      `/api/notifications?unreadOnly=false${since !== undefined ? `&since=${since}` : ""}`,
    ),

  unreadCount: () => apiClient.get<{ count: number }>("/api/notifications/unread-count"),

  markRead: (id: number) => apiClient.patch<void>(`/api/notifications/${id}/read`),

  markAllRead: () => apiClient.post<void>("/api/notifications/read-all"),

  // FCM device registration (notification FE guide) — required after login so
  // the BE can multicast pushes when the tab is backgrounded/closed.
  registerDeviceToken: (deviceToken: string) =>
    apiClient.post<void>("/api/notifications/device-tokens", {
      deviceToken,
      deviceType: "WEB",
    }),

  deleteDeviceToken: (deviceToken: string) =>
    apiClient.delete<void>(
      `/api/notifications/device-tokens?token=${encodeURIComponent(deviceToken)}`,
    ),

  // Broadcasts "<Approver> is reviewing" on presence-request-{id} via Pusher.
  setReviewingPresence: (requestId: number, isReviewing: boolean) =>
    apiClient.post<void>(
      `/api/notifications/presence/reviewing?requestId=${requestId}&isReviewing=${isReviewing}`,
    ),
}
