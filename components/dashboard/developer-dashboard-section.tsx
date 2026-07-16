import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { RequestStatus } from "@/lib/constants"

const TILE_LABELS: Record<RequestStatus, string> = {
  DRAFT: "Drafts",
  PENDING_REVIEW: "Pending review",
  CHANGES_REQUESTED: "Changes requested",
  APPROVED: "Approved",
  REJECTED: "Rejected",
}

export function DeveloperDashboardSection({
  myRequests,
}: {
  myRequests: Record<RequestStatus, number>
}) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="font-heading text-sm font-medium text-muted-foreground">Developer</h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {(Object.keys(TILE_LABELS) as RequestStatus[]).map((status) => (
          <Card key={status} size="sm">
            <CardHeader>
              <CardTitle>{myRequests[status]}</CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground">
              {TILE_LABELS[status]}
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  )
}
