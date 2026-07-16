"use client"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Message, MessageAvatar, MessageContent, MessageHeader } from "@/components/ui/message"
import {
  MessageScroller,
  MessageScrollerButton,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerProvider,
  MessageScrollerViewport,
} from "@/components/ui/message-scroller"
import { cn } from "@/lib/utils"
import type { ConversationMessage } from "@/lib/types/api"

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase()
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })
}

// Deliberately flat — no threads/replies, just a chronological line between
// the developer and whichever approver(s) are involved, per the problem
// statement's "very simple, no nested communication" ask.
export function MessageList({
  messages,
  currentUserId,
}: {
  messages: ConversationMessage[]
  currentUserId: number
}) {
  if (messages.length === 0) {
    return <p className="text-sm text-muted-foreground">No messages yet — say hello.</p>
  }

  const lastId = messages[messages.length - 1]?.id

  return (
    <MessageScrollerProvider autoScroll defaultScrollPosition="end">
      <MessageScroller className="h-full">
        <MessageScrollerViewport>
          <MessageScrollerContent>
            {messages.map((message) => {
              const isLast = message.id === lastId

              if (message.system) {
                return (
                  <MessageScrollerItem
                    key={message.id}
                    messageId={String(message.id)}
                    scrollAnchor={isLast}
                  >
                    <p className="text-center text-xs text-muted-foreground">{message.text}</p>
                  </MessageScrollerItem>
                )
              }

              const isMine = message.sender?.id === currentUserId
              const align = isMine ? "end" : "start"

              return (
                <MessageScrollerItem
                  key={message.id}
                  messageId={String(message.id)}
                  scrollAnchor={isLast}
                >
                  <Message align={align}>
                    <MessageAvatar>
                      <Avatar size="sm">
                        <AvatarFallback>{initials(message.sender?.name ?? "?")}</AvatarFallback>
                      </Avatar>
                    </MessageAvatar>
                    <MessageContent>
                      <MessageHeader>{message.sender?.name}</MessageHeader>
                      <div
                        className={cn(
                          "max-w-md rounded-2xl px-3.5 py-2 text-sm",
                          isMine ? "self-end bg-primary text-primary-foreground" : "self-start bg-muted",
                        )}
                      >
                        {message.text}
                      </div>
                      <span
                        className={cn(
                          "px-3.5 text-xs text-muted-foreground",
                          isMine && "self-end",
                        )}
                      >
                        {formatTime(message.createdAt)}
                      </span>
                    </MessageContent>
                  </Message>
                </MessageScrollerItem>
              )
            })}
          </MessageScrollerContent>
        </MessageScrollerViewport>
        <MessageScrollerButton />
      </MessageScroller>
    </MessageScrollerProvider>
  )
}
