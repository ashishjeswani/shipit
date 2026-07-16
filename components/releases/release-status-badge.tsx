import { Badge } from "@/components/ui/badge"
import type { ReleaseStatus } from "@/lib/constants"

const STATUS_VARIANT: Record<ReleaseStatus, "secondary" | "default" | "outline"> = {
  OPEN: "default",
  READY_FOR_DEPLOYMENT: "secondary",
  CLOSED: "outline",
}

export function ReleaseStatusBadge({ status }: { status: ReleaseStatus }) {
  return <Badge variant={STATUS_VARIANT[status]}>{status.replaceAll("_", " ")}</Badge>
}
