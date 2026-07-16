import Pusher from "pusher-js"

import { getStoredToken } from "@/lib/auth/token"
import { API_BASE_URL, PUSHER_CLUSTER, PUSHER_KEY } from "@/lib/constants"

// NOTE: the live backend (docs/BACKEND_API_GUIDE.md §8) speaks STOMP/WebSocket
// only — there is no `/api/notifications/pusher/auth` endpoint and nothing
// server-side ever publishes here. This client was wired against an external
// reference spec at the user's explicit request, accepting that channel auth
// will fail and `new-notification` will never actually fire until a matching
// BE-side Pusher integration exists (see docs/frontend/05-realtime.md's note).
// REST (lib/api/notifications.ts) is unaffected and fully functional on its own.
export function createPusherClient() {
  return new Pusher(PUSHER_KEY, {
    cluster: PUSHER_CLUSTER,
    channelAuthorization: {
      endpoint: `${API_BASE_URL}/api/notifications/pusher/auth`,
      transport: "ajax",
      headers: { Authorization: `Bearer ${getStoredToken() ?? ""}` },
    },
  })
}

export function userNotificationChannel(userId: number) {
  return `private-user-${userId}`
}
