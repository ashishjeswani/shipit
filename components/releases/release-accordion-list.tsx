import { EmptyState } from "@/components/common/empty-state"
import { ReleaseAccordionItem } from "@/components/releases/release-accordion-item"
import { Accordion } from "@/components/ui/accordion"
import type { Release } from "@/lib/types/api"

export function ReleaseAccordionList({ releases }: { releases: Release[] }) {
  if (releases.length === 0) {
    return (
      <EmptyState
        title="No releases yet"
        description="Releases created by approvers will show up here."
      />
    )
  }

  return (
    <Accordion>
      {releases.map((release) => (
        <ReleaseAccordionItem key={release.id} release={release} />
      ))}
    </Accordion>
  )
}
