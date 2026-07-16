import { StatTile } from "@/components/dashboard/stat-tile"

interface ApproverSectionProps {
  pendingReviews: number
  assignedToMe: number
}

export function ApproverSection({ pendingReviews, assignedToMe }: ApproverSectionProps) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="font-heading text-sm font-medium">Review queue</h2>
      <div className="grid grid-cols-2 gap-3 sm:max-w-sm">
        <StatTile label="Pending reviews" value={pendingReviews} />
        <StatTile label="Assigned to you" value={assignedToMe} />
      </div>
    </section>
  )
}
