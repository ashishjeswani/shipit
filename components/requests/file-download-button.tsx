"use client"

import { DownloadIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import type { RequestFile } from "@/lib/types/api"

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  return `${(bytes / 1024).toFixed(1)} KB`
}

// Mock stand-in for the real GET /api/requests/{id}/file blob-download flow
// (docs/frontend/09-error-handling.md) — swap the body for that fetch once
// the endpoint exists; the button's contract (name + click handler) won't change.
export function FileDownloadButton({ file }: { file: RequestFile }) {
  function handleDownload() {
    const blob = new Blob([`Mock content for ${file.name}`], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = file.name
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <Button variant="outline" size="sm" onClick={handleDownload}>
      <DownloadIcon data-icon="inline-start" />
      {file.name}
      <span className="text-muted-foreground">({formatBytes(file.size)})</span>
    </Button>
  )
}
