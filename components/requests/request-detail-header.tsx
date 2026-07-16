import { RequestStatusBadge } from "@/components/requests/request-status-badge"
import type { DeploymentRequestDetail } from "@/lib/types/api"

export function RequestDetailHeader({ request }: { request: DeploymentRequestDetail }) {
  return (
    <div className="flex flex-col gap-3">
      {request.release && (
        <span className="text-xs text-muted-foreground">{request.release.name}</span>
      )}
      <h1 className="font-heading text-xl font-medium">{request.title}</h1>
      <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
        <RequestStatusBadge status={request.status} />
        <span>Opened by {request.owner.name}</span>
        {request.assignedReviewer && <span>· Assigned to {request.assignedReviewer.name}</span>}
      </div>
    </div>
  )
}
