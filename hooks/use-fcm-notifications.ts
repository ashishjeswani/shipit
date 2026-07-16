"use client"

import { useEffect, useRef } from "react"
import { useQueryClient } from "@tanstack/react-query"

import {
  getFirebaseMessaging,
  onMessage,
  registerFcmDeviceToken,
} from "@/lib/firebase/config"
import {
  showNotificationToast,
  suppressRestNotificationToasts,
  syncNotificationsFromRest,
} from "@/lib/notifications/sync"
import { keys } from "@/lib/query/keys"

const POLL_MS = 20_000

/**
 * Registers the FCM token, toasts foreground pushes, and polls
 * GET /api/notifications/my as a fallback when FCM/Pusher miss.
 */
export function useFcmNotifications(enabled: boolean) {
  const queryClient = useQueryClient()
  const seeded = useRef(false)

  useEffect(() => {
    if (!enabled) return

    let unsubscribe: (() => void) | undefined
    let cancelled = false
    let pollTimer: ReturnType<typeof setInterval> | undefined

    ;(async () => {
      // Seed watermark from REST before listening so reconnect/history
      // doesn't spam toasts for old rows.
      try {
        await syncNotificationsFromRest({ queryClient, toastNew: false })
        seeded.current = true
      } catch (error) {
        console.error("Failed to seed notifications from REST:", error)
      }
      if (cancelled) return

      await registerFcmDeviceToken()
      if (cancelled) return

      const messaging = await getFirebaseMessaging()
      if (messaging && !cancelled) {
        unsubscribe = onMessage(messaging, (payload) => {
          const title =
            payload.notification?.title ||
            (typeof payload.data?.type === "string" ? payload.data.type : null) ||
            "ShipIt Notification"
          const body =
            payload.notification?.body ||
            (typeof payload.data?.payload === "string" ? payload.data.payload : null) ||
            (typeof payload.data?.body === "string" ? payload.data.body : null) ||
            "You have a new update."

          showNotificationToast({ title, message: body })
          suppressRestNotificationToasts()

          // REST is source of truth for the bell — refetch and advance
          // watermark without a second toast (suppressed briefly after FCM).
          void syncNotificationsFromRest({ queryClient, toastNew: true }).catch((error) => {
            console.error("Failed to refresh notifications after FCM:", error)
            queryClient.invalidateQueries({ queryKey: keys.notifications.list() })
            queryClient.invalidateQueries({ queryKey: keys.notifications.unreadCount() })
          })
        })
      }

      // Fallback when FCM is unsupported, permission denied, or a push is missed.
      pollTimer = setInterval(() => {
        void syncNotificationsFromRest({ queryClient, toastNew: true }).catch((error) => {
          console.error("Notification poll failed:", error)
        })
      }, POLL_MS)
    })()

    const onFocus = () => {
      if (!seeded.current) return
      void syncNotificationsFromRest({ queryClient, toastNew: true }).catch(() => {})
    }
    window.addEventListener("focus", onFocus)

    return () => {
      cancelled = true
      unsubscribe?.()
      if (pollTimer) clearInterval(pollTimer)
      window.removeEventListener("focus", onFocus)
    }
  }, [enabled, queryClient])
}
