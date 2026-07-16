import { apiClient } from "@/lib/api/client"
import { enrichNotification, type NotificationDto } from "@/lib/api/enrich-notification"
import type { Notification } from "@/lib/types/api"

async function fetchMyNotifications(): Promise<Notification[]> {
  // Live BE: GET /api/notifications/my → NotificationReadDto[]
  // (generic GET /api/notifications is paginated CRUD and not the inbox).
  const raw = await apiClient.get<NotificationDto[] | { content?: NotificationDto[] }>(
    "/api/notifications/my",
  )
  const rows = Array.isArray(raw) ? raw : Array.isArray(raw?.content) ? raw.content : []
  return rows.map(enrichNotification)
}

async function fetchUnreadCount(): Promise<{ count: number }> {
  // Live swagger: bare int64. Guide/BE §7: { count }. Accept both.
  const raw = await apiClient.get<number | { count: number }>("/api/notifications/unread-count")
  if (typeof raw === "number" && Number.isFinite(raw)) return { count: raw }
  if (raw && typeof raw === "object" && typeof raw.count === "number") {
    return { count: raw.count }
  }
  return { count: 0 }
}

export const notificationsApi = {
  list: () => fetchMyNotifications(),

  unreadCount: () => fetchUnreadCount(),

  markRead: (id: number) => apiClient.patch<void>(`/api/notifications/${id}/read`),

  markAllRead: () => apiClient.post<void>("/api/notifications/read-all"),

  // FCM device registration — required after login so the BE can multicast
  // pushes when the tab is backgrounded/closed.
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
