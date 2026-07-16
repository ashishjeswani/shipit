import { Badge } from "@/components/ui/badge"
import type { ReleaseStatus } from "@/lib/constants"

const STATUS_LABEL: Record<ReleaseStatus, string> = {
  OPEN: "Open",
  READY_FOR_DEPLOYMENT: "Ready for deployment",
  CLOSED: "Closed",
}

const STATUS_VARIANT: Record<ReleaseStatus, "default" | "secondary" | "outline"> = {
  OPEN: "default",
  READY_FOR_DEPLOYMENT: "secondary",
  CLOSED: "outline",
}

export function ReleaseStatusBadge({ status }: { status: ReleaseStatus }) {
  return <Badge variant={STATUS_VARIANT[status]}>{STATUS_LABEL[status]}</Badge>
}
