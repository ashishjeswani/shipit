import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { RequestStatus } from "@/lib/constants"

const STATUS_LABEL: Record<RequestStatus, string> = {
  DRAFT: "Draft",
  PENDING_APPROVAL: "Pending approval",
  CHANGES_REQUESTED: "Changes requested",
  APPROVED: "Approved",
  REJECTED: "Rejected",
}

const STATUS_VARIANT: Record<RequestStatus, "default" | "secondary" | "outline" | "destructive"> = {
  DRAFT: "outline",
  PENDING_APPROVAL: "default",
  CHANGES_REQUESTED: "secondary",
  APPROVED: "outline",
  REJECTED: "destructive",
}

const APPROVED_CLASSES =
  "border-transparent bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"

export function RequestStatusBadge({ status }: { status: RequestStatus }) {
  return (
    <Badge
      variant={STATUS_VARIANT[status]}
      className={cn(status === "APPROVED" && APPROVED_CLASSES)}
    >
      {STATUS_LABEL[status]}
    </Badge>
  )
}
