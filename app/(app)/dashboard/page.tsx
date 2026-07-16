"use client"

import { ApproverDashboardSection } from "@/components/dashboard/approver-dashboard-section"
import { DeveloperDashboardSection } from "@/components/dashboard/developer-dashboard-section"
import { ReleaseAccordionList } from "@/components/dashboard/release-accordion-list"
import { useAuth } from "@/hooks/use-auth"
import { useDashboard } from "@/hooks/use-dashboard"
import { useReleases } from "@/hooks/use-releases"

export default function DashboardPage() {
  const { user } = useAuth()
  const { data, isLoading: dashboardLoading } = useDashboard()
  const { data: releases, isLoading: releasesLoading } = useReleases()

  // (app)/layout.tsx only mounts this once status === "authenticated", but
  // that's not visible to TypeScript across the component boundary.
  if (!user) return null

  return (
    <div className="flex flex-col gap-6">
      {/* Sticky so the summary cards stay put while only the release list
          below scrolls (its own bounded, scrollable Card). */}
      <div className="sticky top-0 z-10 flex flex-col gap-6 bg-background pb-2">
        <h1 className="font-heading text-xl font-medium">Dashboard</h1>
        {(dashboardLoading || releasesLoading) && (
          <p className="text-sm text-muted-foreground">Loading dashboard…</p>
        )}
        {/* Dual-role users see both sections stacked, never tabbed behind a click
            (docs/frontend/07-auth-and-permissions.md dual-role UX). */}
        {data.developer && <DeveloperDashboardSection myRequests={data.developer.myRequests} />}
        {data.approver && (
          <ApproverDashboardSection
            releases={releases}
            pendingReviews={data.approver.pendingReviews}
            assignedToMe={data.approver.assignedToMe}
          />
        )}
      </div>

      {data.approver && (
        <div className="flex h-136 flex-col">
          <ReleaseAccordionList releases={releases} user={user} />
        </div>
      )}

      {!data.developer && !data.approver && (
        <p className="text-sm text-muted-foreground">
          {user.name} has no dashboard data for their current roles.
        </p>
      )}
    </div>
  )
}
