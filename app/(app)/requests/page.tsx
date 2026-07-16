"use client"

import { ApproverRequestList } from "@/components/requests/approver-request-list"
import { DeveloperRequestList } from "@/components/requests/developer-request-list"
import { useAuth } from "@/hooks/use-auth"
import { useRequests } from "@/hooks/use-requests"
import { hasRole } from "@/lib/auth/capabilities"

export default function RequestsPage() {
  const { user } = useAuth()
  const { data, isLoading } = useRequests()

  if (!user) return null

  const myRequests = data.filter((request) => request.mine)
  // Approvers see everything past DRAFT, including requests they can't open yet
  // (locked, greyed) and their own if they hold both roles — BE §4 list scoping.
  const reviewableRequests = data.filter((request) => request.status !== "DRAFT")

  return (
    <div className="flex flex-col gap-8">
      <h1 className="font-heading text-xl font-medium">Requests</h1>
      {isLoading && <p className="text-sm text-muted-foreground">Loading requests…</p>}
      {hasRole(user, "DEVELOPER") && <DeveloperRequestList requests={myRequests} user={user} />}
      {hasRole(user, "APPROVER") && (
        <ApproverRequestList requests={reviewableRequests} user={user} />
      )}
    </div>
  )
}
