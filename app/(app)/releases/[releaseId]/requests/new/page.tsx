"use client"

import { useParams, useRouter } from "next/navigation"

import { CreateRequestForm } from "@/components/requests/create-request-form"
import { useAuth } from "@/hooks/use-auth"
import { useRelease } from "@/hooks/use-release"
import { canCreateRequest } from "@/lib/auth/capabilities"

export default function NewRequestPage() {
  const { releaseId } = useParams<{ releaseId: string }>()
  const id = Number(releaseId)
  const router = useRouter()

  const { user } = useAuth()
  const { data: release, isLoading, error } = useRelease(id)

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Loading release…</p>
  }

  if (error || !release) {
    return <p className="text-sm text-muted-foreground">Release not found.</p>
  }

  if (!canCreateRequest(user, release)) {
    return (
      <p className="text-sm text-muted-foreground">
        You can&apos;t create a request against this release.
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-heading text-xl font-medium">New request — {release.name}</h1>
      <CreateRequestForm
        releaseId={id}
        onCreated={(requestId) => router.push(`/requests/${requestId}`)}
      />
    </div>
  )
}
