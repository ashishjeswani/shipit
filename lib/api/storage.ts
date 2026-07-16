import { apiClient } from "@/lib/api/client"

// Live Storage tag on swagger (/api/v1/storage/*) — confirmed 2026-07-16.
// Upload returns { uuid, userId }; download is binary under the same coords.
export interface StorageUploadResult {
  uuid: string
  userId: string
}

export const storageApi = {
  // POST /api/v1/storage/upload?userId=&prefix=
  async upload(
    userId: string | number,
    file: File,
    prefix?: string,
  ): Promise<StorageUploadResult> {
    const params = new URLSearchParams({ userId: String(userId) })
    if (prefix) params.set("prefix", prefix)
    const form = new FormData()
    form.append("file", file)
    return apiClient.postForm<StorageUploadResult>(
      `/api/v1/storage/upload?${params}`,
      form,
    )
  },

  // GET /api/v1/storage/{userId}/{uuid} or .../{userId}/{prefix}/{uuid}
  async download(userId: string, uuid: string, prefix?: string): Promise<Blob> {
    const path = prefix
      ? `/api/v1/storage/${encodeURIComponent(userId)}/${encodeURIComponent(prefix)}/${encodeURIComponent(uuid)}`
      : `/api/v1/storage/${encodeURIComponent(userId)}/${encodeURIComponent(uuid)}`
    return apiClient.getBlob(path)
  },
}
