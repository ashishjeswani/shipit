"use client"

import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useRequestMutations } from "@/hooks/use-request-mutations"
import { useUsers } from "@/hooks/use-users"
import { FIELD_LIMITS } from "@/lib/constants"
import { cn } from "@/lib/utils"

// POST /api/releases/{releaseId}/requests per docs/BACKEND_API_GUIDE.md, but
// the live DeploymentRequestCreateDto only accepts {title, description} today
// (no releaseId/assignedReviewerId/file — see lib/api/requests.ts). This form
// still collects and sends the full intended payload: harmless now (BE drops
// the extra fields), correct once BE catches up. There's no file upload
// control since the live DTO has no file field at all yet.
export function CreateRequestForm({
  releaseId,
  onCreated,
}: {
  releaseId: number
  onCreated: (requestId: number) => void
}) {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [assignedReviewerId, setAssignedReviewerId] = useState<number | null>(null)
  const { data: users } = useUsers()
  const { create } = useRequestMutations()

  const trimmedTitle = title.trim()
  const trimmedDescription = description.trim()
  const titleValid =
    trimmedTitle.length >= FIELD_LIMITS.requestTitle.min &&
    trimmedTitle.length <= FIELD_LIMITS.requestTitle.max
  const descriptionValid =
    trimmedDescription.length >= FIELD_LIMITS.requestDescription.min &&
    trimmedDescription.length <= FIELD_LIMITS.requestDescription.max
  const canSubmit = titleValid && descriptionValid && !create.isPending

  function handleSubmit() {
    if (!canSubmit) return
    create.mutate(
      { title: trimmedTitle, description: trimmedDescription, releaseId, assignedReviewerId },
      { onSuccess: (dto) => onCreated(dto.id) },
    )
  }

  return (
    <div className="flex max-w-lg flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium text-muted-foreground" htmlFor="request-title">
          Title
        </label>
        <Input
          id="request-title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          maxLength={FIELD_LIMITS.requestTitle.max}
          aria-invalid={title.length > 0 && !titleValid}
          placeholder="e.g. Deploy payment service v2"
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium text-muted-foreground" htmlFor="request-description">
          Description
        </label>
        <Textarea
          id="request-description"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          rows={5}
          maxLength={FIELD_LIMITS.requestDescription.max}
          aria-invalid={description.length > 0 && !descriptionValid}
          placeholder="What does this script do?"
        />
      </div>
      {users && users.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-muted-foreground">
            Assigned reviewer (optional)
          </span>
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => setAssignedReviewerId(null)}
              className={cn(
                "rounded-full border px-2.5 py-1 text-xs transition-colors",
                assignedReviewerId === null
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-muted-foreground hover:text-foreground",
              )}
            >
              Anyone
            </button>
            {users.map((approver) => (
              <button
                key={approver.id}
                type="button"
                onClick={() => setAssignedReviewerId(approver.id)}
                className={cn(
                  "rounded-full border px-2.5 py-1 text-xs transition-colors",
                  assignedReviewerId === approver.id
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border text-muted-foreground hover:text-foreground",
                )}
              >
                {approver.name}
              </button>
            ))}
          </div>
        </div>
      )}
      {create.isError && (
        <p className="text-xs text-destructive">
          {create.error instanceof Error ? create.error.message : "Failed to create request."}
        </p>
      )}
      <Button onClick={handleSubmit} disabled={!canSubmit} className="w-fit">
        {create.isPending ? "Creating…" : "Create request"}
      </Button>
    </div>
  )
}
