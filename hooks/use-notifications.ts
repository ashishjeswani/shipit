"use client"

import { useQuery } from "@tanstack/react-query"

import { notificationsApi } from "@/lib/api/notifications"
import { keys } from "@/lib/query/keys"
import type { Notification } from "@/lib/types/api"

export function useNotifications(): {
  data: Notification[]
  unreadCount: number
  isLoading: boolean
  error: Error | null
} {
  const list = useQuery({ queryKey: keys.notifications.list(), queryFn: () => notificationsApi.list() })
  const unread = useQuery({
    queryKey: keys.notifications.unreadCount(),
    queryFn: notificationsApi.unreadCount,
  })

  // Guard the render path against a failed or wrong-shaped response: a query
  // that errors leaves `data` undefined, and a malformed body can leave it a
  // non-array. Either way `data.map` would crash the whole header, so coerce
  // to a safe array / number here rather than trusting the payload downstream.
  return {
    data: Array.isArray(list.data) ? list.data : [],
    unreadCount: typeof unread.data?.count === "number" ? unread.data.count : 0,
    isLoading: list.isLoading || unread.isLoading,
    error: list.error ?? unread.error,
  }
}
