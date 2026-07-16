"use client"

import { useEffect, useRef } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { useUsers } from "@/hooks/use-users"
import { messagesApi } from "@/lib/api/messages"
import { keys } from "@/lib/query/keys"
import type { ConversationMessage, MessageDto, UserSummary } from "@/lib/types/api"

function enrichMessage(
  dto: MessageDto,
  usersById: Map<number, UserSummary>,
): ConversationMessage | null {
  if (dto.status === "DELETED") return null

  const sender: UserSummary | null = dto.system
    ? null
    : (dto.sender ??
      (dto.senderId != null
        ? (usersById.get(dto.senderId) ?? { id: dto.senderId, name: `User ${dto.senderId}` })
        : null))

  return {
    id: dto.id,
    requestId: dto.requestId,
    sender,
    text: dto.text,
    system: dto.system,
    createdAt: dto.createdAt,
  }
}

// GET/POST /api/requests/{id}/messages + mark-read (BE §5). Enabled only when
// the viewer is allowed to open the request — a locked-to-someone-else 403
// would otherwise clear the session via apiClient.
export function useRequestMessages(
  id: number,
  options: { enabled?: boolean } = {},
): {
  data: ConversationMessage[]
  isLoading: boolean
  error: Error | null
  send: ReturnType<typeof useMutation<MessageDto, Error, string>>
} {
  const { enabled = true } = options
  const queryClient = useQueryClient()
  const usersQuery = useUsers()

  const messagesQuery = useQuery({
    queryKey: keys.requestMessages(id),
    queryFn: () => messagesApi.list(id),
    enabled: enabled && Number.isFinite(id) && id > 0,
    retry: false,
  })

  // Mark the thread read once per request open so list unreadMessages badges
  // clear (BE §5 / docs/frontend/08). Do not key off dataUpdatedAt — a refetch
  // must not re-fire mark-read.
  const markedReadForId = useRef<number | null>(null)
  useEffect(() => {
    if (!enabled || !messagesQuery.isSuccess) return
    if (markedReadForId.current === id) return
    markedReadForId.current = id
    void messagesApi.markRead(id).then(() => {
      queryClient.invalidateQueries({ queryKey: keys.requests.list() })
    })
  }, [enabled, id, messagesQuery.isSuccess, queryClient])

  const usersById = new Map((usersQuery.data ?? []).map((u) => [u.id, u]))
  const data = (messagesQuery.data ?? [])
    .map((dto) => enrichMessage(dto, usersById))
    .filter((m): m is ConversationMessage => m != null)

  const send = useMutation({
    mutationFn: (text: string) => messagesApi.create(id, text),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.requestMessages(id) })
      queryClient.invalidateQueries({ queryKey: keys.requests.list() })
    },
  })

  return {
    data,
    isLoading: enabled && (messagesQuery.isLoading || usersQuery.isLoading),
    error: messagesQuery.error ?? usersQuery.error,
    send,
  }
}
