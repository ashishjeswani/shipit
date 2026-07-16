import Link from "next/link"

import { RelativeTime } from "@/components/common/relative-time"
import { ReleaseStatusBadge } from "@/components/releases/release-status-badge"
import { Avatar, AvatarFallback, AvatarGroup } from "@/components/ui/avatar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { Release } from "@/lib/types/api"

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
}

export function ReleaseCard({ release }: { release: Release }) {
  return (
    <Link href={`/releases/${release.id}`}>
      <Card className="transition-colors hover:bg-muted/40">
        <CardHeader>
          <div className="flex items-start justify-between gap-2">
            <CardTitle>{release.name}</CardTitle>
            <ReleaseStatusBadge status={release.status} />
          </div>
        </CardHeader>
        <CardContent className="flex items-center justify-between gap-4">
          <div className="flex flex-col gap-1 text-sm text-muted-foreground">
            <span>
              {release.requestCount} request{release.requestCount === 1 ? "" : "s"}
              {typeof release.myRequestCount === "number"
                ? ` · ${release.myRequestCount} mine`
                : ""}
            </span>
            <span>
              Created by {release.createdBy.name} · <RelativeTime iso={release.createdAt} />
            </span>
          </div>
          <AvatarGroup>
            {release.approvers.map((approver) => (
              <Avatar key={approver.id} size="sm">
                <AvatarFallback>{initials(approver.name)}</AvatarFallback>
              </Avatar>
            ))}
          </AvatarGroup>
        </CardContent>
      </Card>
    </Link>
  )
}
