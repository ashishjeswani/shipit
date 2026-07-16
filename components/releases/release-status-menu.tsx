"use client"

import { useState } from "react"
import { ChevronDown } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useReleaseMutations } from "@/hooks/use-release-mutations"
import type { ReleaseStatus } from "@/lib/constants"

// Forward-oriented transitions for the OPEN → READY_FOR_DEPLOYMENT → CLOSED
// lifecycle (lib/constants.ts RELEASE_STATUSES), plus a reopen escape hatch out
// of READY_FOR_DEPLOYMENT. CLOSED is terminal, so it offers no actions. The
// live BE's PATCH .../status (releasesApi.updateStatus) accepts any target, so
// these labels define the product-level flow rather than a BE-enforced machine.
const TRANSITIONS: Record<ReleaseStatus, { status: ReleaseStatus; label: string }[]> = {
  OPEN: [{ status: "READY_FOR_DEPLOYMENT", label: "Mark ready for deployment" }],
  READY_FOR_DEPLOYMENT: [
    { status: "CLOSED", label: "Close release" },
    { status: "OPEN", label: "Reopen for changes" },
  ],
  CLOSED: [],
}

// The release-level approval control (docs/frontend/08-ui-architecture.md §
// /releases/[releaseId], endpoint map row PATCH /api/releases/{id}/status).
// Rendered only for approvers by the page; caller owns that gate.
export function ReleaseStatusMenu({
  release,
}: {
  release: { id: number; status: ReleaseStatus }
}) {
  const { updateStatus } = useReleaseMutations()
  const [open, setOpen] = useState(false)
  const transitions = TRANSITIONS[release.status] ?? []

  // A terminal status (CLOSED) has no forward move — render nothing rather than
  // a permanently-disabled dead affordance.
  if (transitions.length === 0) return null

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={<Button variant="outline" size="sm" disabled={updateStatus.isPending} />}
      >
        Change status
        <ChevronDown />
      </PopoverTrigger>
      <PopoverContent align="end" className="w-56 p-1">
        {transitions.map((transition) => (
          <Button
            key={transition.status}
            variant="ghost"
            size="sm"
            className="w-full justify-start"
            disabled={updateStatus.isPending}
            onClick={() =>
              updateStatus.mutate(
                { id: release.id, status: transition.status },
                { onSuccess: () => setOpen(false) },
              )
            }
          >
            {transition.label}
          </Button>
        ))}
      </PopoverContent>
    </Popover>
  )
}
