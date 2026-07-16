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
import { useReviewActions } from "@/hooks/use-review-actions"
import { canReview } from "@/lib/auth/capabilities"
import { ApiClientError } from "@/lib/types/errors"
import type { ConversationMessage } from "@/lib/types/api"

export default function RequestDetailPage() {
  const { requestId } = useParams<{ requestId: string }>()
  const id = Number(requestId)

  const { user } = useAuth()
  const { data: request, isLoading } = useRequest(id)
  const { data: history } = useRequestHistory(id)
  const { data: baseMessages } = useRequestMessages(id)
  const { approve, reject, requestChanges } = useReviewActions()

  // Messages still mock-send until messages.create is wired; keep local
  // extras only for the composer path.
  const [extraMessages, setExtraMessages] = useState<ConversationMessage[]>([])
  const [decisionError, setDecisionError] = useState<string | null>(null)

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Loading request…</p>
  }

  if (!user) return null

  if (!request) {
    return <p className="text-sm text-muted-foreground">Request not found.</p>
  }

  const messages = [...baseMessages, ...extraMessages]

  if (request.locked) {
    return <LockedBanner reviewerName={request.assignedReviewer?.name} />
  }

  const showReviewActions = canReview(user, request)
  const currentUser = user
  const deciding =
    approve.isPending || reject.isPending || requestChanges.isPending

  async function handleDecide(
    decision: "APPROVED" | "REJECTED" | "CHANGES_REQUESTED",
    comment: string,
  ) {
    setDecisionError(null)
    try {
      if (decision === "APPROVED") {
        await approve.mutateAsync({ id, comment: comment || undefined })
      } else if (decision === "REJECTED") {
        await reject.mutateAsync({ id, comment: comment || undefined })
      } else {
        await requestChanges.mutateAsync({ id, comment })
      }
    } catch (err) {
      setDecisionError(decisionErrorMessage(err))
      throw err
    }
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

        {showReviewActions && (
          <div className="flex flex-col gap-2">
            <ReviewActions onDecide={handleDecide} pending={deciding} />
            {decisionError && <p className="text-sm text-destructive">{decisionError}</p>}
          </div>
        )}

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

function decisionErrorMessage(err: unknown): string {
  if (!(err instanceof ApiClientError)) return "Could not record that decision."
  switch (err.error.code) {
    case "REQUEST_ALREADY_DECIDED":
      return "Someone else just decided on this request."
    case "REQUEST_NOT_REVIEWABLE":
      return "This request's status changed — refresh and try again."
    case "NOT_RELEASE_APPROVER":
      return "You don't have permission for this."
    default:
      return err.error.message || "Could not record that decision."
  }
}
