"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"

import { notificationsApi } from "@/lib/api/notifications"
import { keys } from "@/lib/query/keys"
import type { Notification } from "@/lib/types/api"

// Optimistic here (unlike releases/requests, see 01-architecture.md) because
// read-state isn't a first-write-wins server decision — worst case a stale
// read flag gets corrected by the next invalidation.
export function useNotificationMutations() {
  const queryClient = useQueryClient()

  const markRead = useMutation({
    mutationFn: (id: number) => notificationsApi.markRead(id),
    onMutate: async (id: number) => {
      await queryClient.cancelQueries({ queryKey: keys.notifications.list() })
      const previous = queryClient.getQueryData<Notification[]>(keys.notifications.list())
      queryClient.setQueryData<Notification[]>(keys.notifications.list(), (notifications) =>
        notifications?.map((n) => (n.id === id ? { ...n, read: true } : n)),
      )
      queryClient.setQueryData<{ count: number }>(keys.notifications.unreadCount(), (current) =>
        current ? { count: Math.max(0, current.count - 1) } : current,
      )
      return { previous }
    },
    onError: (_err, _id, context) => {
      if (context?.previous) queryClient.setQueryData(keys.notifications.list(), context.previous)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: keys.notifications.list() })
      queryClient.invalidateQueries({ queryKey: keys.notifications.unreadCount() })
    },
  })

  const markAllRead = useMutation({
    mutationFn: () => notificationsApi.markAllRead(),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: keys.notifications.list() })
      const previous = queryClient.getQueryData<Notification[]>(keys.notifications.list())
      queryClient.setQueryData<Notification[]>(keys.notifications.list(), (notifications) =>
        notifications?.map((n) => ({ ...n, read: true })),
      )
      queryClient.setQueryData(keys.notifications.unreadCount(), { count: 0 })
      return { previous }
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(keys.notifications.list(), context.previous)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: keys.notifications.list() })
      queryClient.invalidateQueries({ queryKey: keys.notifications.unreadCount() })
    },
  })

  return { markRead, markAllRead }
}
