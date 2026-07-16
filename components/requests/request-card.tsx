"use client"

import Link from "next/link"
import { useState } from "react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { RequestStatusBadge } from "@/components/requests/request-status-badge"
import { ReviewCommentDialog } from "@/components/requests/review-comment-dialog"
import { useReviewActions } from "@/hooks/use-review-actions"
import { ApiClientError } from "@/lib/types/errors"
import type { DeploymentRequestListItem } from "@/lib/types/api"

export function RequestCard({
  request,
  canReview,
}: {
  request: DeploymentRequestListItem
  // Absent (not disabled) for the owner or non-reviewers, per
  // docs/frontend/08-ui-architecture.md — a screenshot of this card should
  // never show "review your own request" as a greyed-out temptation.
  canReview: boolean
}) {
  const { approve } = useReviewActions()
  const [approveOpen, setApproveOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleApprove(comment: string) {
    setError(null)
    try {
      await approve.mutateAsync({
        id: request.id,
        comment: comment || undefined,
      })
    } catch (err) {
      setError(decisionErrorMessage(err))
      throw err
    }
  }

  const body = (
    <Card
      size="sm"
      className={
        request.locked
          ? "bg-card opacity-60"
          : "bg-card transition-shadow hover:shadow-sm"
      }
    >
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {request.title}
          {request.unreadMessages ? (
            <Badge variant="secondary">{request.unreadMessages} new</Badge>
          ) : null}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-1.5">
        <div className="flex items-center gap-2">
          <RequestStatusBadge status={request.status} />
          <span className="text-xs text-muted-foreground">{request.owner.name}</span>
        </div>
        {request.locked && (
          <p className="text-xs text-muted-foreground">
            Restricted to {request.assignedReviewer?.name}
          </p>
        )}
        {request.reviewingBy && (
          <p className="text-xs text-muted-foreground">
            {request.reviewingBy.name} is reviewing
          </p>
        )}
        {canReview && (
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              disabled={approve.isPending}
              onClick={(event) => {
                // Card may sit inside a Link — keep Approve from navigating.
                event.preventDefault()
                event.stopPropagation()
                setError(null)
                setApproveOpen(true)
              }}
            >
              Approve
            </Button>
            <Link
              href={`/requests/${request.id}`}
              className="text-xs text-muted-foreground underline-offset-4 hover:underline"
              onClick={(event) => event.stopPropagation()}
            >
              Open details
            </Link>
          </div>
        )}
        {error && <p className="text-xs text-destructive">{error}</p>}
      </CardContent>
    </Card>
  )

  // `locked` requests aren't clickable from the card — defense-in-depth only,
  // the detail page still enforces via `locked-banner.tsx` on direct navigation
  // (docs/frontend/08-ui-architecture.md).
  const card = request.locked ? (
    <Tooltip>
      <TooltipTrigger render={<div />}>{body}</TooltipTrigger>
      <TooltipContent>Restricted to {request.assignedReviewer?.name}</TooltipContent>
    </Tooltip>
  ) : canReview ? (
    // Approvers get an in-place Approve control; the card itself is not a
    // full-surface link so the button isn't nested in an <a>.
    body
  ) : (
    <Link href={`/requests/${request.id}`} className="block">
      {body}
    </Link>
  )

  return (
    <>
      {card}
      {canReview && (
        <ReviewCommentDialog
          open={approveOpen}
          onOpenChange={setApproveOpen}
          title="Approve this request?"
          description="The developer will be notified. You can add an optional comment."
          confirmLabel={approve.isPending ? "Approving…" : "Approve"}
          onConfirm={handleApprove}
        />
      )}
    </>
  )
}

function decisionErrorMessage(err: unknown): string {
  if (!(err instanceof ApiClientError)) return "Could not approve this request."
  switch (err.error.code) {
    case "REQUEST_ALREADY_DECIDED":
      return "Someone else just decided on this request."
    case "REQUEST_NOT_REVIEWABLE":
      return "This request's status changed — refresh and try again."
    case "NOT_RELEASE_APPROVER":
      return "You don't have permission for this."
    default:
      return err.error.message || "Could not approve this request."
  }
}
