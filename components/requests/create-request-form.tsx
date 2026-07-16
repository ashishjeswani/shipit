"use client"

import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useAuth } from "@/hooks/use-auth"
import { useRequestMutations } from "@/hooks/use-request-mutations"
import { useUsers } from "@/hooks/use-users"
import {
  FIELD_LIMITS,
  MAX_SCRIPT_FILE_BYTES,
  SCRIPT_EXTENSIONS,
} from "@/lib/constants"
import { ApiClientError } from "@/lib/types/errors"
import { cn } from "@/lib/utils"

function scriptExt(name: string): string | null {
  const dot = name.lastIndexOf(".")
  if (dot < 0) return null
  return name.slice(dot + 1).toLowerCase()
}

function validateScriptFile(file: File | null): string | null {
  if (!file) return "A script file is required."
  const ext = scriptExt(file.name)
  if (!ext || !(SCRIPT_EXTENSIONS as readonly string[]).includes(ext)) {
    return `File must be .${SCRIPT_EXTENSIONS.join(", .")}.`
  }
  if (file.size < 1 || file.size > MAX_SCRIPT_FILE_BYTES) {
    return "File must be between 1 byte and 5 MB."
  }
  return null
}

// Live create is multipart on POST /api/releases/{releaseId}/requests (file
// required). Script bytes are also uploaded via Storage
// (POST /api/v1/storage/upload) so download can use the working Storage GET.
export function CreateRequestForm({
  releaseId,
  onCreated,
}: {
  releaseId: number
  onCreated: (requestId: number) => void
}) {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [file, setFile] = useState<File | null>(null)
  const [assignedReviewerId, setAssignedReviewerId] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()
  const { data: users } = useUsers()
  const { createAndSubmit } = useRequestMutations()

  const trimmedTitle = title.trim()
  const trimmedDescription = description.trim()
  const titleValid =
    trimmedTitle.length >= FIELD_LIMITS.requestTitle.min &&
    trimmedTitle.length <= FIELD_LIMITS.requestTitle.max
  const descriptionValid =
    trimmedDescription.length >= FIELD_LIMITS.requestDescription.min &&
    trimmedDescription.length <= FIELD_LIMITS.requestDescription.max
  const fileError = validateScriptFile(file)
  const canSubmit =
    titleValid && descriptionValid && !fileError && !!user && !createAndSubmit.isPending

  async function handleSubmit() {
    if (!canSubmit || !file || !user) return
    setError(null)
    try {
      const dto = await createAndSubmit.mutateAsync({
        title: trimmedTitle,
        description: trimmedDescription,
        releaseId,
        file,
        userId: user.id,
        assignedReviewerId,
      })
      onCreated(dto.id)
    } catch (err) {
      setError(
        err instanceof ApiClientError
          ? err.error.message
          : "Failed to submit request for approval.",
      )
    }
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
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium text-muted-foreground" htmlFor="request-file">
          Script file
        </label>
        <Input
          id="request-file"
          type="file"
          accept={SCRIPT_EXTENSIONS.map((ext) => `.${ext}`).join(",")}
          onChange={(event) => setFile(event.target.files?.[0] ?? null)}
          aria-invalid={file !== null && !!fileError}
        />
        {file && fileError && <p className="text-xs text-destructive">{fileError}</p>}
        {file && !fileError && (
          <p className="text-xs text-muted-foreground">
            {file.name} ({(file.size / 1024).toFixed(1)} KB)
          </p>
        )}
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
      {error && <p className="text-xs text-destructive">{error}</p>}
      <Button onClick={handleSubmit} disabled={!canSubmit} className="w-fit">
        {createAndSubmit.isPending ? "Submitting…" : "Submit for approval"}
      </Button>
    </div>
  )
}
