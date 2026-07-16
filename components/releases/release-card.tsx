import Link from "next/link"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { RequestCard } from "@/components/requests/request-card"
import { ReleaseStatusBadge } from "@/components/releases/release-status-badge"
import { canReview } from "@/lib/auth/capabilities"
import type { DeploymentRequestListItem, Release, User } from "@/lib/types/api"

export function ReleaseCard({
  release,
  requests,
  user,
}: {
  release: Release
  requests: DeploymentRequestListItem[]
  user: User
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex flex-col gap-1">
            <CardTitle className="flex flex-wrap items-center gap-2 text-base">
              <Link href={`/releases/${release.id}`} className="hover:underline">
                {release.name}
              </Link>
              <ReleaseStatusBadge status={release.status} />
            </CardTitle>
            <p className="text-sm text-muted-foreground">{release.description}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs whitespace-nowrap text-muted-foreground">
              {requests.length} request{requests.length === 1 ? "" : "s"}
            </span>
          </div>
        </div>
      </CardHeader>
      <Separator />
      <CardContent className="flex flex-col gap-2">
        {requests.length === 0 ? (
          <p className="text-sm text-muted-foreground">No requests in this release yet.</p>
        ) : (
          requests.map((request) => (
            // Each request is a "commit" on this release's "PR" — same card used
            // on the requests page, so review-gating (self-review, locked) stays
            // in one place regardless of which screen renders it.
            <RequestCard
              key={request.id}
              request={request}
              canReview={canReview(user, request)}
            />
          ))
        )}
      </CardContent>
    </Card>
  )
}
