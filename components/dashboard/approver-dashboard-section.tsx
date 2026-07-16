import { CheckCircle2, Clock, Layers, RotateCcw, UserCheck, XCircle } from "lucide-react"

import { StatCard } from "@/components/dashboard/stat-card"
import type { ReleaseWithRequests } from "@/hooks/use-releases"

export function ApproverDashboardSection({
  releases,
  pendingReviews,
  assignedToMe,
}: {
  releases: ReleaseWithRequests[]
  pendingReviews: number
  assignedToMe: number
}) {
  // Aggregated across every release's requests so the approver sees the same
  // "already approved / rejected / changes requested" states the request list
  // itself uses (docs/frontend/03-data-model.md RequestStatus), not just the
  // two counters BE §6 returns on its own.
  const allRequests = releases.flatMap(({ requests }) => requests)
  const approved = allRequests.filter((request) => request.status === "APPROVED").length
  const rejected = allRequests.filter((request) => request.status === "REJECTED").length
  const changesRequested = allRequests.filter(
    (request) => request.status === "CHANGES_REQUESTED",
  ).length

  return (
    <section className="flex flex-col gap-3">
      <h2 className="font-heading text-sm font-medium text-muted-foreground">Approver</h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard label="Releases" value={releases.length} icon={Layers} tone="neutral" />
        <StatCard label="Requests" value={pendingReviews} icon={Clock} tone="amber" />
        <StatCard label="Assigned to me" value={assignedToMe} icon={UserCheck} tone="sky" />
        <StatCard label="Approved" value={approved} icon={CheckCircle2} tone="emerald" />
        <StatCard
          label="Changes requested"
          value={changesRequested}
          icon={RotateCcw}
          tone="orange"
        />
        <StatCard label="Rejected" value={rejected} icon={XCircle} tone="rose" />
      </div>
    </section>
  )
}
