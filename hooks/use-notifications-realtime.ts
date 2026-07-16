"use client"

import { useEffect } from "react"
import { useQueryClient } from "@tanstack/react-query"

import { keys } from "@/lib/query/keys"
import { PUSHER_KEY } from "@/lib/constants"
import { createPusherClient, userNotificationChannel } from "@/lib/realtime/pusher-client"

// Mounted once, globally, from (app)/layout.tsx — every authenticated screen
// needs the bell kept fresh regardless of which page is open. Pusher events
// are cache-invalidation hints only (same rule as WS elsewhere in this app,
// see docs/frontend/05-realtime.md): the handler never writes the event
// payload into the cache, it just invalidates and lets REST refetch.
export function useNotificationsRealtime(userId: number | undefined) {
  const queryClient = useQueryClient()

  useEffect(() => {
    // No PUSHER_KEY configured (the default in this repo — see lib/constants.ts)
    // means skip entirely rather than let the Pusher client throw on an empty key.
    if (!userId || !PUSHER_KEY) return

    const pusher = createPusherClient()
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
      pusher.disconnect()
    }
  }, [userId, queryClient])
}
