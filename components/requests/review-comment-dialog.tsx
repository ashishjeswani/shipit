"use client"

import { useState } from "react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"

export function ReviewCommentDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  commentRequired = false,
  onConfirm,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  confirmLabel: string
  // Comment is optional for approve/reject, required for request-changes (BE §4).
  commentRequired?: boolean
  onConfirm: (comment: string) => void
}) {
  const [comment, setComment] = useState("")

  function handleOpenChange(next: boolean) {
    onOpenChange(next)
    if (!next) setComment("")
  }

  function handleConfirm() {
    onConfirm(comment.trim())
    handleOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <Textarea
          value={comment}
          onChange={(event) => setComment(event.target.value)}
          placeholder={
            commentRequired ? "Explain what needs to change…" : "Add a comment (optional)"
          }
          rows={3}
          autoFocus
        />
        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
          <Button onClick={handleConfirm} disabled={commentRequired && comment.trim().length === 0}>
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
