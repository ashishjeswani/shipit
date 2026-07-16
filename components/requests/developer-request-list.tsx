import { RequestCard } from "@/components/requests/request-card"
import type { DeploymentRequestListItem } from "@/lib/types/api"

export function DeveloperRequestList({ requests }: { requests: DeploymentRequestListItem[] }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="font-heading text-sm font-medium text-muted-foreground">
        My requests ({requests.length})
      </h2>
      {requests.length === 0 ? (
        <p className="text-sm text-muted-foreground">You haven&apos;t created a request yet.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {requests.map((request) => (
            // A developer never gets review affordances on their own request.
            <RequestCard key={request.id} request={request} canReview={false} />
          ))}
        </div>
      )}
    </section>
  )
}
