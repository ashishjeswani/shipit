import type { QueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import { notificationsApi } from "@/lib/api/notifications"
import { keys } from "@/lib/query/keys"
import type { Notification } from "@/lib/types/api"
import { useRealtimeStore } from "@/stores/realtime-store"

/** After an FCM toast, skip REST-driven toasts briefly to avoid duplicates. */
let suppressRestToastsUntil = 0

export function suppressRestNotificationToasts(ms = 5_000) {
  suppressRestToastsUntil = Date.now() + ms
}

export function showNotificationToast(
  notification: Pick<Notification, "title" | "message">,
) {
  toast(notification.title, {
    description: notification.message,
  })
}

/**
 * Pulls the inbox from REST, updates Query cache, and optionally toasts rows
 * newer than lastSeenNotificationId. First seed (lastSeen === 0) never toasts
 * historical items — only advances the watermark.
 */
export async function syncNotificationsFromRest(options: {
  queryClient: QueryClient
  toastNew: boolean
}) {
  const { queryClient, toastNew } = options
  const [list, unread] = await Promise.all([
    notificationsApi.list(),
    notificationsApi.unreadCount(),
  ])

  queryClient.setQueryData(keys.notifications.list(), list)
  queryClient.setQueryData(keys.notifications.unreadCount(), unread)

  const lastSeen = useRealtimeStore.getState().lastSeenNotificationId
  const maxId = list.reduce((max, n) => Math.max(max, n.id), 0)

  if (lastSeen === 0) {
    if (maxId > 0) useRealtimeStore.getState().bumpLastSeen(maxId)
    return
  }

  const fresh = list
    .filter((n) => n.id > lastSeen)
    .sort((a, b) => a.id - b.id)

  const mayToast = toastNew && Date.now() >= suppressRestToastsUntil

  for (const n of fresh) {
    if (mayToast) showNotificationToast(n)
    useRealtimeStore.getState().bumpLastSeen(n.id)
  }

  // If nothing fresh but max advanced somehow, still keep watermark coherent.
  if (fresh.length === 0 && maxId > lastSeen) {
    useRealtimeStore.getState().bumpLastSeen(maxId)
  }
}
