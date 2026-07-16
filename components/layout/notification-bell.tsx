"use client"

import { Bell } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Separator } from "@/components/ui/separator"
import { useFcmNotifications } from "@/hooks/use-fcm-notifications"
import { useNotificationMutations } from "@/hooks/use-notification-mutations"
import { useNotifications } from "@/hooks/use-notifications"
import { useNotificationsRealtime } from "@/hooks/use-notifications-realtime"
import { cn } from "@/lib/utils"

export function NotificationBell({ userId }: { userId: number }) {
  const { data, unreadCount, isLoading } = useNotifications()
  const { markRead, markAllRead } = useNotificationMutations()
  // Pusher private-user channel (live bell) + FCM (foreground + background push).
  // REST above remains the source of truth for list/unread-count.
  useNotificationsRealtime(userId)
  useFcmNotifications(true)

  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button variant="ghost" size="icon-sm" className="relative" aria-label="Notifications" />
        }
      >
        <Bell />
        {unreadCount > 0 && (
          <Badge
            variant="destructive"
            className="absolute -top-1 -right-1 h-4 min-w-4 justify-center px-1 text-[10px]"
          >
            {unreadCount > 99 ? "99+" : unreadCount}
          </Badge>
        )}
      </PopoverTrigger>

      <PopoverContent align="end" className="w-80 gap-0 p-0">
        <PopoverHeader className="flex-row items-center justify-between px-3 py-2.5">
          <PopoverTitle className="text-sm">Notifications</PopoverTitle>
          {unreadCount > 0 && (
            <Button
              variant="link"
              size="sm"
              className="h-auto p-0 text-xs"
              onClick={() => markAllRead.mutate()}
            >
              Mark all as read
            </Button>
          )}
        </PopoverHeader>
        <Separator />
        <div className="max-h-96 overflow-y-auto">
          {isLoading && <p className="p-4 text-sm text-muted-foreground">Loading…</p>}
          {!isLoading && data?.length === 0 && (
            <p className="p-4 text-sm text-muted-foreground">No notifications</p>
          )}
          {data?.map((notification) => (
            <button
              key={notification.id}
              type="button"
              onClick={() => !notification.read && markRead.mutate(notification.id)}
              className={cn(
                "flex w-full flex-col gap-0.5 border-b px-3 py-2.5 text-left last:border-b-0 hover:bg-muted",
                !notification.read && "bg-primary/5",
              )}
            >
              <span className="text-sm font-medium">{notification.title}</span>
              <span className="text-sm text-muted-foreground">{notification.message}</span>
              <span className="text-xs text-muted-foreground">
                {new Date(notification.createdAt).toLocaleString()}
              </span>
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}
