import Pusher from "pusher-js"

import { getStoredToken } from "@/lib/auth/token"
import { API_BASE_URL, PUSHER_CLUSTER, PUSHER_KEY } from "@/lib/constants"
import { useRealtimeStore } from "@/stores/realtime-store"

// Shared singleton — notification bell + per-request presence subscriptions
// all share one connection. Auth hits POST /api/notifications/pusher/auth
// with a fresh bearer token on every private/presence channel subscribe.
let client: Pusher | null = null

export function getPusherClient(): Pusher | null {
  if (typeof window === "undefined") return null
  if (!PUSHER_KEY) return null

  if (!client) {
    client = new Pusher(PUSHER_KEY, {
      cluster: PUSHER_CLUSTER,
      channelAuthorization: {
        endpoint: `${API_BASE_URL}/api/notifications/pusher/auth`,
        transport: "ajax",
        headersProvider: () => ({
          Authorization: `Bearer ${getStoredToken() ?? ""}`,
        }),
      },
    })

    client.connection.bind("state_change", (states: { current: string }) => {
      const status =
        states.current === "connected"
          ? "open"
          : states.current === "connecting"
            ? "connecting"
            : "closed"
      useRealtimeStore.getState().setConnectionStatus(status)
    })
  }

  return client
}

export function disconnectPusher() {
  if (!client) return
  client.disconnect()
  client = null
  useRealtimeStore.getState().setConnectionStatus("closed")
}

/** @deprecated Prefer getPusherClient() — kept for call-site compatibility during migration. */
export function createPusherClient() {
  return getPusherClient()!
}

export function userNotificationChannel(userId: number) {
  return `private-user-${userId}`
}

export function requestPresenceChannel(requestId: number) {
  return `presence-request-${requestId}`
}

export interface ReviewStatusChangedPayload {
  approverName: string
  isReviewing: boolean
  message?: string
  /** Optional — present when BE includes the approver id. */
  approverId?: number
}
