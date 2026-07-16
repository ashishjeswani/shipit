import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { RequestCard } from "@/components/requests/request-card"
import { ReleaseStatusBadge } from "@/components/releases/release-status-badge"
import { canReview } from "@/lib/auth/capabilities"
import type { ReleaseStatus } from "@/lib/constants"
import type { ReleaseWithRequests } from "@/hooks/use-releases"
import type { User } from "@/lib/types/api"
import { cn } from "@/lib/utils"

// Same colors as the release lifecycle: open = active (sky), ready = good to
// go (emerald), closed = done (neutral) — a quick-scan dot next to the badge.
const STATUS_DOT: Record<ReleaseStatus, string> = {
  OPEN: "bg-sky-500",
  READY_FOR_DEPLOYMENT: "bg-emerald-500",
  CLOSED: "bg-muted-foreground/40",
}

export function ReleaseAccordionList({
  releases,
  user,
}: {
  releases: ReleaseWithRequests[]
  user: User
}) {
  return (
    <Card className="flex h-full flex-col overflow-hidden">
      <CardHeader className="shrink-0">
        <CardTitle className="text-sm font-medium text-muted-foreground">Releases</CardTitle>
      </CardHeader>
      <CardContent className="min-h-0 flex-1 overflow-y-auto">
        {releases.length === 0 ? (
          <p className="text-sm text-muted-foreground">No releases yet.</p>
        ) : (
          <Accordion
            multiple
            defaultValue={releases.map(({ release }) => release.id)}
            className="rounded-none border-none"
          >
            {releases.map(({ release, requests }) => (
              <AccordionItem key={release.id} value={release.id}>
                <AccordionTrigger>
                  <div className="flex flex-1 flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span
                        className={cn("size-2 shrink-0 rounded-full", STATUS_DOT[release.status])}
                        aria-hidden
                      />
                      <span className="font-heading text-sm font-medium">{release.name}</span>
                      <ReleaseStatusBadge status={release.status} />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs whitespace-nowrap text-muted-foreground">
                        {requests.length} request{requests.length === 1 ? "" : "s"}
                      </span>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  {requests.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No requests in this release yet.</p>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {requests.map((request) => (
                        <RequestCard
                          key={request.id}
                          request={request}
                          canReview={canReview(user, request)}
                        />
                      ))}
                    </div>
                  )}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}
      </CardContent>
    </Card>
  )
}
