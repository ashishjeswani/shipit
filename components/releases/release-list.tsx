import { EmptyState } from "@/components/common/empty-state"
import { ReleaseCard } from "@/components/releases/release-card"
import type { Release } from "@/lib/types/api"

export function ReleaseList({ releases }: { releases: Release[] }) {
  if (releases.length === 0) {
    return (
      <EmptyState
        title="No releases yet"
        description="Releases created by approvers will show up here."
      />
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {releases.map((release) => (
        <ReleaseCard key={release.id} release={release} />
      ))}
    </div>
  )
}
