"use client"

import { useEffect } from "react"
import { useQueryClient } from "@tanstack/react-query"

import { keys } from "@/lib/query/keys"
import { PUSHER_KEY } from "@/lib/constants"
import {
  getPusherClient,
  userNotificationChannel,
} from "@/lib/realtime/pusher-client"

// Mounted once, globally, from NotificationBell — every authenticated screen
// needs the bell kept fresh. Pusher events are cache-invalidation hints only
// (REST remains source of truth; see docs/frontend/05-realtime.md).
export function useNotificationsRealtime(userId: number | undefined) {
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!userId || !PUSHER_KEY) return

    const pusher = getPusherClient()
    if (!pusher) return

    const channelName = userNotificationChannel(userId)
    const channel = pusher.subscribe(channelName)

    const invalidate = () => {
      queryClient.invalidateQueries({ queryKey: keys.notifications.list() })
      queryClient.invalidateQueries({ queryKey: keys.notifications.unreadCount() })
    }
    channel.bind("new-notification", invalidate)

    return () => {
      channel.unbind_all()
      pusher.unsubscribe(channelName)
      // Do not disconnect the shared client — presence subscriptions may still need it.
    }
  }, [userId, queryClient])
}
