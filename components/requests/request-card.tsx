import Link from "next/link"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { RequestStatusBadge } from "@/components/requests/request-status-badge"
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
  const body = (
    <Card size="sm" className={request.locked ? "opacity-60" : "transition-shadow hover:shadow-sm"}>
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
          <Button size="sm" className="mt-1 w-fit" nativeButton={false} render={<span />}>
            Review
          </Button>
        )}
      </CardContent>
    </Card>
  )

  // `locked` requests aren't clickable from the card — defense-in-depth only,
  // the detail page still enforces via `locked-banner.tsx` on direct navigation
  // (docs/frontend/08-ui-architecture.md).
  if (request.locked) {
    return (
      <Tooltip>
        <TooltipTrigger render={<div />}>{body}</TooltipTrigger>
        <TooltipContent>Restricted to {request.assignedReviewer?.name}</TooltipContent>
      </Tooltip>
    )
  }

  return (
    <Link href={`/requests/${request.id}`} className="block">
      {body}
    </Link>
  )
}
