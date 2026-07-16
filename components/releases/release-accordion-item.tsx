import { RelativeTime } from "@/components/common/relative-time"
import { EmptyState } from "@/components/common/empty-state"
import { RequestStatusBadge } from "@/components/requests/request-status-badge"
import { ReleaseStatusBadge } from "@/components/releases/release-status-badge"
import { AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Avatar, AvatarFallback, AvatarGroup } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { useRequests } from "@/hooks/use-requests"
import type { Release } from "@/lib/types/api"

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
}

export function ReleaseAccordionItem({ release }: { release: Release }) {
  const { data: requests } = useRequests(release.id)

  return (
    <AccordionItem value={String(release.id)}>
      <AccordionTrigger>
        <div className="flex flex-1 flex-col gap-2">
          <div className="flex items-start justify-between gap-2">
            <span className="font-heading font-medium">{release.name}</span>
            <ReleaseStatusBadge status={release.status} />
          </div>
          <div className="flex items-center justify-between gap-4 text-xs text-muted-foreground">
            <span>
              {requests.length} request{requests.length === 1 ? "" : "s"} visible to you · Created
              by {release.createdBy.name} · <RelativeTime iso={release.createdAt} />
            </span>
            <AvatarGroup>
              {release.approvers.map((approver) => (
                <Avatar key={approver.id} size="sm">
                  <AvatarFallback>{initials(approver.name)}</AvatarFallback>
                </Avatar>
              ))}
            </AvatarGroup>
          </div>
        </div>
      </AccordionTrigger>
      <AccordionContent>
        {requests.length === 0 ? (
          <EmptyState title="No requests here yet" />
        ) : (
          <div className="flex flex-col gap-2">
            {requests.map((request) => (
              <div
                key={request.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-border px-3 py-2 text-sm"
              >
                <div className="flex flex-col gap-0.5">
                  <span className="font-medium">{request.title}</span>
                  <span className="text-xs text-muted-foreground">
                    {request.owner.name} · <RelativeTime iso={request.createdAt} />
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {request.mine ? (
                    <Badge variant="outline" className="text-[10px]">
                      Mine
                    </Badge>
                  ) : null}
                  <RequestStatusBadge status={request.status} />
                </div>
              </div>
            ))}
          </div>
        )}
      </AccordionContent>
    </AccordionItem>
  )
}
