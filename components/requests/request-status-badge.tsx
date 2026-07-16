import { Badge } from "@/components/ui/badge"
import type { RequestStatus } from "@/lib/constants"

const STATUS_VARIANT: Record<RequestStatus, "secondary" | "default" | "destructive" | "outline"> = {
  DRAFT: "outline",
  PENDING_REVIEW: "secondary",
  CHANGES_REQUESTED: "destructive",
  APPROVED: "default",
  REJECTED: "destructive",
}

export function RequestStatusBadge({ status }: { status: RequestStatus }) {
  return <Badge variant={STATUS_VARIANT[status]}>{status.replaceAll("_", " ")}</Badge>
}
