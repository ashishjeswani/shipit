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

  return {
    data: list.data ?? [],
    unreadCount: unread.data?.count ?? 0,
    isLoading: list.isLoading || unread.isLoading,
    error: list.error ?? unread.error,
  }
}
