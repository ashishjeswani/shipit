"use client"

import { useParams } from "next/navigation"
import { useState } from "react"

import { FileDownloadButton } from "@/components/requests/file-download-button"
import { HistoryTimeline } from "@/components/requests/history-timeline"
import { LockedBanner } from "@/components/requests/locked-banner"
import { MessageComposer } from "@/components/requests/message-composer"
import { MessageList } from "@/components/requests/message-list"
import { RequestDetailHeader } from "@/components/requests/request-detail-header"
import { ReviewActions } from "@/components/requests/review-actions"
import { ReviewingBanner } from "@/components/requests/reviewing-banner"
import { useAuth } from "@/hooks/use-auth"
import { useRequest } from "@/hooks/use-request"
import { useRequestHistory } from "@/hooks/use-request-history"
import { useRequestMessages } from "@/hooks/use-request-messages"
import { canReview } from "@/lib/auth/capabilities"
import type { RequestStatus } from "@/lib/constants"
import type { ConversationMessage, HistoryEntry } from "@/lib/types/api"

const DECISION_COPY: Record<string, string> = {
  APPROVED: "approved this request.",
  REJECTED: "rejected this request.",
  CHANGES_REQUESTED: "requested changes on this request.",
}

export default function RequestDetailPage() {
  const { requestId } = useParams<{ requestId: string }>()
  const id = Number(requestId)

  const { user } = useAuth()
  const { data: fetchedRequest, isLoading } = useRequest(id)
  const { data: baseHistory } = useRequestHistory(id)
  const { data: baseMessages } = useRequestMessages(id)

  // Mock stage only: there's no backend to persist a decision or a sent
  // message, so this page holds the interaction locally. Once
  // requests.approve/reject/requestChanges and messages.create ([04](../../../docs/frontend/04-api-endpoint-map.md))
  // exist, these become mutations that invalidate the query cache instead.
  const [statusOverride, setStatusOverride] = useState<RequestStatus | null>(null)
  const [extraHistory, setExtraHistory] = useState<HistoryEntry[]>([])
  const [extraMessages, setExtraMessages] = useState<ConversationMessage[]>([])

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Loading request…</p>
  }

  if (!user) return null

  if (!fetchedRequest) {
    return <p className="text-sm text-muted-foreground">Request not found.</p>
  }

  const request = statusOverride ? { ...fetchedRequest, status: statusOverride } : fetchedRequest
  const history = [...baseHistory, ...extraHistory]
  const messages = [...baseMessages, ...extraMessages]

  if (request.locked) {
    return <LockedBanner reviewerName={request.assignedReviewer?.name} />
  }

  const showReviewActions = canReview(user, request)
  // `user` is narrowed to non-null above, but that narrowing doesn't carry
  // into the nested function declarations below — capture it once here.
  const currentUser = user

  function handleDecide(decision: "APPROVED" | "REJECTED" | "CHANGES_REQUESTED", comment: string) {
    setStatusOverride(decision)
    setExtraHistory((prev) => [
      ...prev,
      { at: new Date().toISOString(), by: currentUser, event: decision },
    ])
    setExtraMessages((prev) => [
      ...prev,
      {
        id: Date.now(),
        requestId: id,
        sender: null,
        text: `${currentUser.name} ${DECISION_COPY[decision]}`,
        system: true,
        createdAt: new Date().toISOString(),
      },
      ...(comment
        ? [
            {
              id: Date.now() + 1,
              requestId: id,
              sender: currentUser,
              text: comment,
              system: false,
              createdAt: new Date().toISOString(),
            },
          ]
        : []),
    ])
  }

  function handleSend(text: string) {
    setExtraMessages((prev) => [
      ...prev,
      {
        id: Date.now(),
        requestId: id,
        sender: currentUser,
        text,
        system: false,
        createdAt: new Date().toISOString(),
      },
    ])
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
      <div className="flex flex-col gap-6">
        <RequestDetailHeader request={request} />

        {request.reviewingBy && request.reviewingBy.id !== user.id && (
          <ReviewingBanner reviewerName={request.reviewingBy.name} />
        )}

        {/* description/file aren't returned by the live BE's
            DeploymentRequestReadDto yet (lib/types/api.ts) — shown only when present. */}
        {request.description ? (
          <p className="text-sm whitespace-pre-wrap">{request.description}</p>
        ) : (
          <p className="text-sm text-muted-foreground italic">
            No description available (not returned by the backend yet).
          </p>
        )}

        {request.file && <FileDownloadButton file={request.file} />}

        {showReviewActions && <ReviewActions onDecide={handleDecide} />}

        <div className="flex flex-col gap-3">
          <h2 className="font-heading text-sm font-medium text-muted-foreground">History</h2>
          <HistoryTimeline entries={history} />
        </div>
      </div>

      <div className="flex h-[32rem] flex-col gap-3 rounded-2xl border p-4 lg:h-auto">
        <h2 className="font-heading text-sm font-medium text-muted-foreground">Conversation</h2>
        <div className="min-h-0 flex-1">
          <MessageList messages={messages} currentUserId={user.id} />
        </div>
        <MessageComposer onSend={handleSend} />
      </div>
    </div>
  )
}
