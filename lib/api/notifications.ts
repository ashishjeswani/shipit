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
}
