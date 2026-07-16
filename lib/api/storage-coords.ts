// Client-only stash for Storage upload coords. Live FileSummaryDto doesn't
// return uuid/userId, and GET /api/requests/{id}/file is currently broken on
// S3 — so after create we keep the Storage keys here for download.
const PREFIX = "shipit:storage:"

export interface StoredFileCoords {
  uuid: string
  storageUserId: string
  storagePrefix?: string
}

export function rememberStorageCoords(requestId: number, coords: StoredFileCoords) {
  if (typeof sessionStorage === "undefined") return
  sessionStorage.setItem(`${PREFIX}${requestId}`, JSON.stringify(coords))
}

export function readStorageCoords(requestId: number): StoredFileCoords | null {
  if (typeof sessionStorage === "undefined") return null
  const raw = sessionStorage.getItem(`${PREFIX}${requestId}`)
  if (!raw) return null
  try {
    return JSON.parse(raw) as StoredFileCoords
  } catch {
    return null
  }
}
