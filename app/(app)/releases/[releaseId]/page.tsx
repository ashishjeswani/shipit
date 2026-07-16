"use client"

import Link from "next/link"
import { useParams } from "next/navigation"

import { RequestCard } from "@/components/requests/request-card"
import { ReleaseStatusBadge } from "@/components/releases/release-status-badge"
import { ReleaseStatusMenu } from "@/components/releases/release-status-menu"
import { buttonVariants } from "@/components/ui/button"
import { useAuth } from "@/hooks/use-auth"
import { useRelease } from "@/hooks/use-release"
import { useRequests } from "@/hooks/use-requests"
import { canCreateRequest, canReview, canSubmitRequest, hasRole } from "@/lib/auth/capabilities"

export default function ReleaseDetailPage() {
  const { releaseId } = useParams<{ releaseId: string }>()
  const id = Number(releaseId)

  const { user } = useAuth()
  const { data: release, isLoading: releaseLoading, error } = useRelease(id)
  const { data: requests, isLoading: requestsLoading } = useRequests()

  if (releaseLoading) {
    return <p className="text-sm text-muted-foreground">Loading release…</p>
  }

  if (error || !release) {
    return <p className="text-sm text-muted-foreground">Release not found.</p>
  }

  const scopedRequests = requests.filter((request) => request.releaseId === id)

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <h1 className="font-heading text-xl font-medium">{release.name}</h1>
            <ReleaseStatusBadge status={release.status} />
          </div>
          {release.description && (
            <p className="text-sm text-muted-foreground">{release.description}</p>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {/* Gate is "approvers on this release" when the list is present;
              fall back to the role check if the payload omits approvers. */}
          {hasRole(user, "APPROVER") && <ReleaseStatusMenu release={release} />}
          {canCreateRequest(user, release) && (
            <Link href={`/releases/${id}/requests/new`} className={buttonVariants({ size: "sm" })}>
              New request
            </Link>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        {requestsLoading && <p className="text-sm text-muted-foreground">Loading requests…</p>}
        {!requestsLoading && scopedRequests.length === 0 && (
          <p className="text-sm text-muted-foreground">No requests in this release yet.</p>
        )}
        {scopedRequests.map((request) => (
          <RequestCard
            key={request.id}
            request={request}
            canReview={canReview(user, request)}
            canSubmit={canSubmitRequest(user, request)}
          />
        ))}
      </div>
    </div>
  )
}
