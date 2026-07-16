import { Badge } from "@/components/ui/badge"
import type { ReleaseStatus } from "@/lib/constants"

const STATUS_VARIANT: Record<ReleaseStatus, "secondary" | "default" | "outline"> = {
  OPEN: "default",
  READY_FOR_DEPLOYMENT: "secondary",
  CLOSED: "outline",
}

export function ReleaseStatusBadge({ status }: { status?: ReleaseStatus }) {
  // A missing/unknown status must never crash the tree that renders this leaf
  // (a null status once took down the whole dashboard via `.replaceAll`).
  const label = status?.replaceAll("_", " ") ?? "Unknown"
  return <Badge variant={(status && STATUS_VARIANT[status]) ?? "outline"}>{label}</Badge>
}
