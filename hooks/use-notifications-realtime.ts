"use client"

import { useEffect } from "react"
import { useQueryClient } from "@tanstack/react-query"

import { PUSHER_KEY } from "@/lib/constants"
import { syncNotificationsFromRest } from "@/lib/notifications/sync"
import {
  getPusherClient,
  userNotificationChannel,
} from "@/lib/realtime/pusher-client"

// Mounted once, globally, from NotificationBell — every authenticated screen
// needs the bell kept fresh. Pusher events trigger a REST sync + toast for
// any rows newer than the watermark (deduped with FCM via lastSeen id).
export function useNotificationsRealtime(userId: number | undefined) {
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!userId || !PUSHER_KEY) return

    const pusher = getPusherClient()
    if (!pusher) return

    const channelName = userNotificationChannel(userId)
    const channel = pusher.subscribe(channelName)

    const onNew = () => {
      void syncNotificationsFromRest({ queryClient, toastNew: true }).catch((error) => {
        console.error("Failed to sync notifications after Pusher event:", error)
      })
    }
    channel.bind("new-notification", onNew)

    return () => {
      channel.unbind("new-notification", onNew)
      pusher.unsubscribe(channelName)
    }
  }, [userId, queryClient])
}
