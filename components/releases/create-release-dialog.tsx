"use client"

import { useState } from "react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useReleaseMutations } from "@/hooks/use-release-mutations"
import { useUsers } from "@/hooks/use-users"
import { FIELD_LIMITS } from "@/lib/constants"
import { cn } from "@/lib/utils"

// POST /api/releases (BE §3) — the live ReleaseCreateDto also has known
// bugs (name/description silently come back empty, see lib/api/releases.ts'
// header comment); this form sends the correct payload regardless so it's
// already right once BE fixes it.
export function CreateReleaseDialog() {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [approverIds, setApproverIds] = useState<number[]>([])
  const { data: users } = useUsers()
  const { create } = useReleaseMutations()

  const trimmedName = name.trim()
  const nameValid =
    trimmedName.length >= FIELD_LIMITS.releaseName.min &&
    trimmedName.length <= FIELD_LIMITS.releaseName.max

  function toggleApprover(id: number) {
    setApproverIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  function reset() {
    setName("")
    setDescription("")
    setApproverIds([])
    create.reset()
  }

  function handleSubmit() {
    if (!nameValid) return
    create.mutate(
      {
        name: trimmedName,
        description: description.trim() || undefined,
        approverIds: approverIds.length ? approverIds : undefined,
      },
      { onSuccess: () => setOpen(false) },
    )
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (!next) reset()
      }}
    >
      <DialogTrigger render={<Button size="sm" />}>New release</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New release</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground" htmlFor="release-name">
              Name
            </label>
            <Input
              id="release-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              maxLength={FIELD_LIMITS.releaseName.max}
              aria-invalid={name.length > 0 && !nameValid}
              placeholder="e.g. Q3 Payments Rollout"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label
              className="text-xs font-medium text-muted-foreground"
              htmlFor="release-description"
            >
              Description
            </label>
            <Textarea
              id="release-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={3}
              placeholder="What's in this release?"
            />
          </div>
          {users && users.length > 0 && (
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-muted-foreground">
                Approvers (optional)
              </span>
              <div className="flex flex-wrap gap-1.5">
                {users.map((approver) => (
                  <button
                    key={approver.id}
                    type="button"
                    onClick={() => toggleApprover(approver.id)}
                    className={cn(
                      "rounded-full border px-2.5 py-1 text-xs transition-colors",
                      approverIds.includes(approver.id)
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
              {create.error instanceof Error ? create.error.message : "Failed to create release."}
            </p>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!nameValid || create.isPending}>
            {create.isPending ? "Creating…" : "Create release"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
