"use client"

import { useEffect } from "react"
import { useQueryClient } from "@tanstack/react-query"

import {
  getFirebaseMessaging,
  onMessage,
  registerFcmDeviceToken,
} from "@/lib/firebase/config"
import { keys } from "@/lib/query/keys"

/**
 * Registers the browser FCM token after login and listens for foreground
 * pushes. Foreground payloads are cache-invalidation hints only — REST
 * (GET /api/notifications) remains the source of truth for the bell list.
 */
export function useFcmNotifications(enabled: boolean) {
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!enabled) return

    let unsubscribe: (() => void) | undefined
    let cancelled = false

    ;(async () => {
      await registerFcmDeviceToken()
      if (cancelled) return

      const messaging = await getFirebaseMessaging()
      if (!messaging || cancelled) return

      unsubscribe = onMessage(messaging, (payload) => {
        queryClient.invalidateQueries({ queryKey: keys.notifications.list() })
        queryClient.invalidateQueries({ queryKey: keys.notifications.unreadCount() })

        // Optional OS toast while the tab is focused (permission already granted
        // during registerFcmDeviceToken). Background/closed tabs use the SW.
        const title =
          payload.notification?.title || payload.data?.type || "ShipIt Notification"
        const body =
          payload.notification?.body ||
          payload.data?.payload ||
          "You have a new update."
        if (typeof Notification !== "undefined" && Notification.permission === "granted") {
          new Notification(title, { body, data: payload.data })
        }
      })
    })()

    return () => {
      cancelled = true
      unsubscribe?.()
    }
  }, [enabled, queryClient])
}
