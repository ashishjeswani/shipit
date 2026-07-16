import { RequestCard } from "@/components/requests/request-card"
import { canReview, canSubmitRequest } from "@/lib/auth/capabilities"
import type { DeploymentRequestListItem, User } from "@/lib/types/api"

export function ApproverRequestList({
  requests,
  user,
}: {
  requests: DeploymentRequestListItem[]
  user: User
}) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="font-heading text-sm font-medium text-muted-foreground">
        Requests to review ({requests.length})
      </h2>
      {requests.length === 0 ? (
        <p className="text-sm text-muted-foreground">No requests in review scope right now.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {requests.map((request) => (
            // `mine: true` (dual-role viewing own request) never renders review
            // affordances — canReview's ownership check enforces that, full stop.
            <RequestCard
              key={request.id}
              request={request}
              canReview={canReview(user, request)}
              canSubmit={canSubmitRequest(user, request)}
            />
          ))}
        </div>
      )}
    </section>
  )
}
