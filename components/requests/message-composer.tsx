"use client"

import { useState } from "react"
import { SendIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { FIELD_LIMITS } from "@/lib/constants"

export function MessageComposer({
  onSend,
  disabled = false,
  disabledReason,
  pending = false,
}: {
  onSend: (text: string) => void | Promise<void>
  // Disabled (not hidden), with a tooltip explaining why, per
  // docs/frontend/08-ui-architecture.md — e.g. the request is locked to
  // another reviewer.
  disabled?: boolean
  disabledReason?: string
  pending?: boolean
}) {
  const [text, setText] = useState("")
  const trimmed = text.trim()
  const overLimit = trimmed.length > FIELD_LIMITS.messageText.max
  const blocked = disabled || pending

  async function handleSend() {
    if (!trimmed || overLimit || blocked) return
    try {
      await onSend(trimmed)
      setText("")
    } catch {
      // Parent surfaces the error; keep the draft so the user can retry.
    }
  }

  const composer = (
    <div className="flex items-end gap-2">
      <Textarea
        value={text}
        onChange={(event) => setText(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault()
            void handleSend()
          }
        }}
        placeholder="Write a message…"
        rows={1}
        disabled={blocked}
        aria-invalid={overLimit}
      />
      <Button
        size="icon"
        onClick={() => void handleSend()}
        disabled={blocked || !trimmed || overLimit}
        aria-label={pending ? "Sending…" : "Send message"}
      >
        <SendIcon />
      </Button>
    </div>
  )

  if (!disabled || !disabledReason) return composer

  return (
    <Tooltip>
      <TooltipTrigger render={<div />}>{composer}</TooltipTrigger>
      <TooltipContent>{disabledReason}</TooltipContent>
    </Tooltip>
  )
}
