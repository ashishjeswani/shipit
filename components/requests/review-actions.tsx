"use client"

import { useState } from "react"

import { Button } from "@/components/ui/button"
import { ReviewCommentDialog } from "@/components/requests/review-comment-dialog"
import type { RequestStatus } from "@/lib/constants"

type ReviewDecision = Extract<RequestStatus, "APPROVED" | "REJECTED" | "CHANGES_REQUESTED">

// Rendered only when canReview is true — absent, not disabled, for the owner
// or non-reviewers (docs/frontend/08-ui-architecture.md).
export function ReviewActions({
  onDecide,
  pending = false,
}: {
  onDecide: (decision: ReviewDecision, comment: string) => void | Promise<void>
  pending?: boolean
}) {
  const [dialog, setDialog] = useState<ReviewDecision | null>(null)

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        <Button disabled={pending} onClick={() => setDialog("APPROVED")}>
          Approve
        </Button>
        <Button
          variant="outline"
          disabled={pending}
          onClick={() => setDialog("CHANGES_REQUESTED")}
        >
          Request changes
        </Button>
        <Button
          variant="destructive"
          disabled={pending}
          onClick={() => setDialog("REJECTED")}
        >
          Reject
        </Button>
      </div>

      <ReviewCommentDialog
        open={dialog === "APPROVED"}
        onOpenChange={(open) => !open && setDialog(null)}
        title="Approve this request?"
        description="The developer will be notified. You can add an optional comment."
        confirmLabel={pending ? "Approving…" : "Approve"}
        onConfirm={(comment) => onDecide("APPROVED", comment)}
      />
      <ReviewCommentDialog
        open={dialog === "REJECTED"}
        onOpenChange={(open) => !open && setDialog(null)}
        title="Reject this request?"
        description="The developer will be notified. You can add an optional comment."
        confirmLabel={pending ? "Rejecting…" : "Reject"}
        onConfirm={(comment) => onDecide("REJECTED", comment)}
      />
      <ReviewCommentDialog
        open={dialog === "CHANGES_REQUESTED"}
        onOpenChange={(open) => !open && setDialog(null)}
        title="Request changes"
        description="Tell the developer what needs to change before you can approve this."
        confirmLabel={pending ? "Sending…" : "Request changes"}
        commentRequired
        onConfirm={(comment) => onDecide("CHANGES_REQUESTED", comment)}
      />
    </div>
  )
}
