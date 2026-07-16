"use client"

import { ApproverSection } from "@/components/dashboard/approver-section"
import { DeveloperSection } from "@/components/dashboard/developer-section"
import { ReleaseAccordionList } from "@/components/releases/release-accordion-list"
import { Separator } from "@/components/ui/separator"
import { useDashboard } from "@/hooks/use-dashboard"

export default function DashboardPage() {
  const { data } = useDashboard()

  return (
    <div className="flex flex-col gap-8">
      <h1 className="font-heading text-xl font-semibold">Dashboard</h1>

      {data.developer ? <DeveloperSection myRequests={data.developer.myRequests} /> : null}

      {data.developer && data.approver ? <Separator /> : null}

      {data.approver ? (
        <ApproverSection
          pendingReviews={data.approver.pendingReviews}
          assignedToMe={data.approver.assignedToMe}
        />
      ) : null}

      <Separator />

      <section className="flex flex-col gap-3">
        <h2 className="font-heading text-sm font-medium">Releases</h2>
        <ReleaseAccordionList releases={data.releases} />
      </section>
    </div>
  )
}
