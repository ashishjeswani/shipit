"use client"

import { useState } from "react"
import { DownloadIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { requestsApi } from "@/lib/api/requests"
import { storageApi } from "@/lib/api/storage"
import type { RequestFile } from "@/lib/types/api"
import { ApiClientError } from "@/lib/types/errors"

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  return `${(bytes / 1024).toFixed(1)} KB`
}

function triggerBlobDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

// Prefer Storage download when create stamped uuid coords onto the file;
// otherwise fall back to GET /api/requests/{id}/file (docs/frontend/09).
export function FileDownloadButton({
  file,
  requestId,
}: {
  file: RequestFile
  requestId: number
}) {
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleDownload() {
    setPending(true)
    setError(null)
    try {
      let blob: Blob
      if (file.uuid && file.storageUserId) {
        blob = await storageApi.download(file.storageUserId, file.uuid, file.storagePrefix)
      } else {
        blob = await requestsApi.downloadFile(requestId)
      }
      triggerBlobDownload(blob, file.name)
    } catch (err) {
      setError(err instanceof ApiClientError ? err.error.message : "Download failed.")
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <Button variant="outline" size="sm" onClick={handleDownload} disabled={pending}>
        <DownloadIcon data-icon="inline-start" />
        {pending ? "Downloading…" : file.name}
        <span className="text-muted-foreground">({formatBytes(file.size)})</span>
      </Button>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}
