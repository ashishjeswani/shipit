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
}: {
  onSend: (text: string) => void
  // Disabled (not hidden), with a tooltip explaining why, per
  // docs/frontend/08-ui-architecture.md — e.g. the request is locked to
  // another reviewer.
  disabled?: boolean
  disabledReason?: string
}) {
  const [text, setText] = useState("")
  const trimmed = text.trim()
  const overLimit = trimmed.length > FIELD_LIMITS.messageText.max

  function handleSend() {
    if (!trimmed || overLimit || disabled) return
    onSend(trimmed)
    setText("")
  }

  const composer = (
    <div className="flex items-end gap-2">
      <Textarea
        value={text}
        onChange={(event) => setText(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault()
            handleSend()
          }
        }}
        placeholder="Write a message…"
        rows={1}
        disabled={disabled}
        aria-invalid={overLimit}
      />
      <Button
        size="icon"
        onClick={handleSend}
        disabled={disabled || !trimmed || overLimit}
        aria-label="Send message"
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
