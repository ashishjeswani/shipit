"use client"

import { CreateReleaseDialog } from "@/components/releases/create-release-dialog"
import { ReleaseCard } from "@/components/releases/release-card"
import { useAuth } from "@/hooks/use-auth"
import { useReleases } from "@/hooks/use-releases"
import { canCreateRelease } from "@/lib/auth/capabilities"

export default function ReleasesPage() {
  const { user } = useAuth()
  const { data, isLoading } = useReleases()

  if (!user) return null

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-heading text-xl font-medium">Releases</h1>
        {canCreateRelease(user) && <CreateReleaseDialog />}
      </div>

      {isLoading && <p className="text-sm text-muted-foreground">Loading releases…</p>}
      {!isLoading && data.length === 0 && (
        <p className="text-sm text-muted-foreground">No releases yet.</p>
      )}

      <div className="flex flex-col gap-3">
        {data.map(({ release, requests }) => (
          <ReleaseCard key={release.id} release={release} requests={requests} user={user} />
        ))}
      </div>
    </div>
  )
}
