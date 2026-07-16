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
import { Button } from "@/components/ui/button"
import { useAuth } from "@/hooks/use-auth"
import { useRequest } from "@/hooks/use-request"
import { useRequestHistory } from "@/hooks/use-request-history"
import { useRequestMessages } from "@/hooks/use-request-messages"
import { useRequestMutations } from "@/hooks/use-request-mutations"
import {
  useRequestPresence,
  useReviewPresenceHeartbeat,
} from "@/hooks/use-request-presence"
import { useReviewActions } from "@/hooks/use-review-actions"
import { canOpenRequest, canReview, canSubmitRequest } from "@/lib/auth/capabilities"
import { ApiClientError } from "@/lib/types/errors"
import { useRealtimeStore } from "@/stores/realtime-store"

export default function RequestDetailPage() {
  const { requestId } = useParams<{ requestId: string }>()
  const id = Number(requestId)

  const { user } = useAuth()
  const { data: request, isLoading } = useRequest(id)
  const { data: history } = useRequestHistory(id)
  const { approve, reject, requestChanges } = useReviewActions()
  const { submit } = useRequestMutations()
  const liveReviewer = useRealtimeStore((s) => s.reviewingBy[id])

  // Subscribe for other viewers; broadcast "is reviewing" when this user can review.
  useRequestPresence(Number.isFinite(id) ? id : undefined)
  const showReviewActions = !!user && !!request && canReview(user, request)
  useReviewPresenceHeartbeat(Number.isFinite(id) ? id : undefined, showReviewActions)

  const canChat = !!user && !!request && canOpenRequest(user, request)
  const {
    data: messages,
    isLoading: messagesLoading,
    send,
  } = useRequestMessages(id, { enabled: canChat })

  const [actionError, setActionError] = useState<string | null>(null)
  const [sendError, setSendError] = useState<string | null>(null)

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Loading request…</p>
  }

  if (!user) return null

  if (!request) {
    return <p className="text-sm text-muted-foreground">Request not found.</p>
  }

  if (request.locked) {
    return <LockedBanner reviewerName={request.assignedReviewer?.name} />
  }

  const showSubmit = canSubmitRequest(user, request)
  const deciding =
    approve.isPending || reject.isPending || requestChanges.isPending
  const reviewingBy = liveReviewer ?? request.reviewingBy

  async function handleDecide(
    decision: "APPROVED" | "REJECTED" | "CHANGES_REQUESTED",
    comment: string,
  ) {
    setActionError(null)
    try {
      if (decision === "APPROVED") {
        await approve.mutateAsync({ id, comment: comment || undefined })
      } else if (decision === "REJECTED") {
        await reject.mutateAsync({ id, comment: comment || undefined })
      } else {
        await requestChanges.mutateAsync({ id, comment })
      }
    } catch (err) {
      setActionError(actionErrorMessage(err))
      throw err
    }
  }

  async function handleSubmit() {
    setActionError(null)
    try {
      await submit.mutateAsync(id)
    } catch (err) {
      setActionError(actionErrorMessage(err))
    }
  }

  async function handleSend(text: string) {
    setSendError(null)
    try {
      await send.mutateAsync(text)
    } catch (err) {
      setSendError(
        err instanceof ApiClientError
          ? err.error.message || "Could not send message."
          : "Could not send message.",
      )
      throw err
    }
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
      <div className="flex flex-col gap-6">
        <RequestDetailHeader request={request} />

        {reviewingBy && reviewingBy.name !== user.name && (
          <ReviewingBanner reviewerName={reviewingBy.name} />
        )}

        {request.description ? (
          <p className="text-sm whitespace-pre-wrap">{request.description}</p>
        ) : (
          <p className="text-sm text-muted-foreground italic">
            No description available (not returned by the backend yet).
          </p>
        )}

        {request.file && <FileDownloadButton file={request.file} requestId={request.id} />}

        {showSubmit && (
          <div className="flex flex-col gap-2">
            <Button className="w-fit" disabled={submit.isPending} onClick={handleSubmit}>
              {submit.isPending
                ? "Submitting…"
                : request.status === "CHANGES_REQUESTED"
                  ? "Resubmit for approval"
                  : "Submit for approval"}
            </Button>
            {actionError && !showReviewActions && (
              <p className="text-sm text-destructive">{actionError}</p>
            )}
          </div>
        )}

        {showReviewActions && (
          <div className="flex flex-col gap-2">
            <ReviewActions onDecide={handleDecide} pending={deciding} />
            {actionError && <p className="text-sm text-destructive">{actionError}</p>}
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
          {messagesLoading ? (
            <p className="text-sm text-muted-foreground">Loading messages…</p>
          ) : (
            <MessageList messages={messages} currentUserId={user.id} />
          )}
        </div>
        <div className="flex flex-col gap-2">
          <MessageComposer onSend={handleSend} pending={send.isPending} />
          {sendError && <p className="text-sm text-destructive">{sendError}</p>}
        </div>
      </div>
    </div>
  )
}

function actionErrorMessage(err: unknown): string {
  if (!(err instanceof ApiClientError)) return "Could not complete that action."
  switch (err.error.code) {
    case "REQUEST_ALREADY_DECIDED":
      return "Someone else just decided on this request."
    case "REQUEST_NOT_REVIEWABLE":
      return "This request's status changed — refresh and try again."
    case "RELEASE_NOT_OPEN":
      return "This release is no longer open for submissions."
    case "NOT_RELEASE_APPROVER":
      return "You don't have permission for this."
    default:
      return err.error.message || "Could not complete that action."
  }
}
