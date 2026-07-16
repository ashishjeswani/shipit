import Link from "next/link"

import { StatTile } from "@/components/dashboard/stat-tile"
import { Button } from "@/components/ui/button"
import type { RequestStatus } from "@/lib/constants"

const STATUS_LABEL: Record<RequestStatus, string> = {
  DRAFT: "Draft",
  PENDING_APPROVAL: "Pending approval",
  CHANGES_REQUESTED: "Changes requested",
  APPROVED: "Approved",
  REJECTED: "Rejected",
}

interface DeveloperSectionProps {
  myRequests: Record<RequestStatus, number>
}

export function DeveloperSection({ myRequests }: DeveloperSectionProps) {
  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="font-heading text-sm font-medium">Your requests</h2>
        <Button
          variant="outline"
          size="sm"
          nativeButton={false}
          render={<Link href="/requests" />}
        >
          My requests
        </Button>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {(Object.keys(STATUS_LABEL) as RequestStatus[]).map((status) => (
          <StatTile key={status} label={STATUS_LABEL[status]} value={myRequests[status]} />
        ))}
      </div>
    </section>
  )
}
