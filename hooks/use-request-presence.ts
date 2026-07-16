"use client"

import { useEffect } from "react"

import { notificationsApi } from "@/lib/api/notifications"
import { PUSHER_KEY } from "@/lib/constants"
import {
  getPusherClient,
  requestPresenceChannel,
  type ReviewStatusChangedPayload,
} from "@/lib/realtime/pusher-client"
import { useRealtimeStore } from "@/stores/realtime-store"

/**
 * Subscribes to `presence-request-{id}` and mirrors `review-status-changed`
 * into realtime-store.reviewingBy (the one sanctioned ephemeral write path).
 */
export function useRequestPresence(requestId: number | undefined) {
  const setReviewing = useRealtimeStore((s) => s.setReviewing)

  useEffect(() => {
    if (!requestId || !PUSHER_KEY) return

    const pusher = getPusherClient()
    if (!pusher) return

    const channelName = requestPresenceChannel(requestId)
    const channel = pusher.subscribe(channelName)

    channel.bind("review-status-changed", (data: ReviewStatusChangedPayload) => {
      if (data.isReviewing) {
        setReviewing(requestId, {
          id: data.approverId ?? 0,
          name: data.approverName,
        })
      } else {
        const current = useRealtimeStore.getState().reviewingBy[requestId]
        if (!current || current.name === data.approverName) {
          setReviewing(requestId, null)
        }
      }
    })

    return () => {
      channel.unbind_all()
      pusher.unsubscribe(channelName)
    }
  }, [requestId, setReviewing])
}

/**
 * When an eligible approver opens the request detail screen, broadcast
 * "is reviewing" and clear it on leave / decision.
 */
export function useReviewPresenceHeartbeat(
  requestId: number | undefined,
  enabled: boolean,
) {
  useEffect(() => {
    if (!requestId || !enabled) return

    let cancelled = false

    ;(async () => {
      try {
        await notificationsApi.setReviewingPresence(requestId, true)
      } catch (error) {
        if (!cancelled) console.error("Failed to set reviewing presence:", error)
      }
    })()

    return () => {
      cancelled = true
      notificationsApi.setReviewingPresence(requestId, false).catch((error) => {
        console.error("Failed to clear reviewing presence:", error)
      })
    }
  }, [requestId, enabled])
}
