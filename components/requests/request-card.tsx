"use client"

import Link from "next/link"
import { useState } from "react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { RequestStatusBadge } from "@/components/requests/request-status-badge"
import { ReviewActions } from "@/components/requests/review-actions"
import { useRequestMutations } from "@/hooks/use-request-mutations"
import { useReviewActions } from "@/hooks/use-review-actions"
import { ApiClientError } from "@/lib/types/errors"
import type { DeploymentRequestListItem } from "@/lib/types/api"
import { cn } from "@/lib/utils"

export function RequestCard({
  request,
  canReview,
  canSubmit = false,
}: {
  request: DeploymentRequestListItem
  // Absent (not disabled) for the owner or non-reviewers, per
  // docs/frontend/08-ui-architecture.md — a screenshot of this card should
  // never show "review your own request" as a greyed-out temptation.
  canReview: boolean
  // Owner + DRAFT / CHANGES_REQUESTED → show "Submit for approval".
  canSubmit?: boolean
}) {
  const { approve, reject, requestChanges } = useReviewActions()
  const { submit } = useRequestMutations()
  const [error, setError] = useState<string | null>(null)

  const deciding =
    approve.isPending || reject.isPending || requestChanges.isPending
  const hasActions = canReview || canSubmit

  async function handleDecide(
    decision: "APPROVED" | "REJECTED" | "CHANGES_REQUESTED",
    comment: string,
  ) {
    setError(null)
    try {
      if (decision === "APPROVED") {
        await approve.mutateAsync({ id: request.id, comment: comment || undefined })
      } else if (decision === "REJECTED") {
        await reject.mutateAsync({ id: request.id, comment: comment || undefined })
      } else {
        await requestChanges.mutateAsync({ id: request.id, comment })
      }
    } catch (err) {
      setError(actionErrorMessage(err))
      throw err
    }
  }

  async function handleSubmit(event: React.MouseEvent) {
    event.preventDefault()
    event.stopPropagation()
    setError(null)
    try {
      await submit.mutateAsync(request.id)
    } catch (err) {
      setError(actionErrorMessage(err))
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
      <CardContent className="flex flex-col gap-2">
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
        {hasActions && (
          <div
            className="mt-1 flex flex-col gap-2"
            onClick={(event) => {
              event.preventDefault()
              event.stopPropagation()
            }}
          >
            {canSubmit && (
              <Button
                size="sm"
                className="w-fit"
                disabled={submit.isPending}
                onClick={handleSubmit}
              >
                {submit.isPending
                  ? "Submitting…"
                  : request.status === "CHANGES_REQUESTED"
                    ? "Resubmit for approval"
                    : "Submit for approval"}
              </Button>
            )}
            {canReview && <ReviewActions onDecide={handleDecide} pending={deciding} />}
            <Link
              href={`/requests/${request.id}`}
              className={cn(buttonVariants({ variant: "link", size: "sm" }), "h-auto w-fit px-0")}
              onClick={(event) => event.stopPropagation()}
            >
              Open details
            </Link>
            {error && <p className="text-xs text-destructive">{error}</p>}
          </div>
        )}
      </CardContent>
    </Card>
  )

  if (request.locked) {
    return (
      <Tooltip>
        <TooltipTrigger render={<div />}>{body}</TooltipTrigger>
        <TooltipContent>Restricted to {request.assignedReviewer?.name}</TooltipContent>
      </Tooltip>
    )
  }

  if (hasActions) {
    return body
  }

  return (
    <Link href={`/requests/${request.id}`} className="block">
      {body}
    </Link>
  )
}

function actionErrorMessage(err: unknown): string {
  if (!(err instanceof ApiClientError)) return "Something went wrong."
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
      return err.error.message || "Something went wrong."
  }
}
