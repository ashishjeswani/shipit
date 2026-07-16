import { apiClient } from "@/lib/api/client"
import { storageApi } from "@/lib/api/storage"
import type { DeploymentRequestDto, RequestFile } from "@/lib/types/api"

interface Page<T> {
  content: T[]
}

export interface CreateRequestInput {
  title: string
  description: string
  releaseId: number
  file: File
  /** Current user id — required by live POST /api/v1/storage/upload. */
  userId: number
  assignedReviewerId?: number | null
}

const STORAGE_PREFIX = "scripts"

function withStorageCoords(
  dto: DeploymentRequestDto,
  upload: { uuid: string; userId: string },
): DeploymentRequestDto {
  if (!dto.file) return dto
  const file: RequestFile = {
    ...dto.file,
    uuid: upload.uuid,
    storageUserId: upload.userId,
    storagePrefix: STORAGE_PREFIX,
  }
  return { ...dto, file }
}

export const requestsApi = {
  // No `releaseId` filter exists on GET /api/deployment-requests (also
  // confirmed by smoke test — the param is silently ignored), so callers
  // that need requests scoped to one release filter this list client-side.
  async list(): Promise<DeploymentRequestDto[]> {
    const page = await apiClient.get<Page<DeploymentRequestDto>>(
      "/api/deployment-requests?page=0&size=200&sort=createdAt,desc",
    )
    return page.content
  },

  async get(id: number): Promise<DeploymentRequestDto> {
    return apiClient.get<DeploymentRequestDto>(`/api/deployment-requests/${id}`)
  },

  // Live create-with-file: POST /api/releases/{releaseId}/requests (multipart).
  // Generic POST /api/deployment-requests ignores title/description/file.
  async create(input: Omit<CreateRequestInput, "userId"> & { status?: string }) {
    const form = new FormData()
    form.append("title", input.title)
    form.append("description", input.description)
    form.append("file", input.file)
    if (input.assignedReviewerId != null) {
      form.append("assignedReviewerId", String(input.assignedReviewerId))
    }
    if (input.status) form.append("status", input.status)
    return apiClient.postForm<DeploymentRequestDto>(
      `/api/releases/${input.releaseId}/requests`,
      form,
    )
  },

  // DeploymentRequestUpdateDto only has title/description/assignedReviewerId
  // today — no way to replace the file via this endpoint.
  async updateTitle(id: number, title: string): Promise<DeploymentRequestDto> {
    return apiClient.put<DeploymentRequestDto>(`/api/deployment-requests/${id}`, { title })
  },

  async remove(id: number): Promise<void> {
    await apiClient.delete<void>(`/api/deployment-requests/${id}`)
  },

  // Lifecycle endpoints live under `/api/requests/{id}/…` (not the generic
  // CRUD `/api/deployment-requests` path) — confirmed on live swagger
  // "Deployment Request Lifecycle" tag, 2026-07-16.
  async approve(id: number, comment?: string): Promise<DeploymentRequestDto> {
    return apiClient.post<DeploymentRequestDto>(
      `/api/requests/${id}/approve`,
      comment ? { comment } : {},
    )
  },

  async reject(id: number, comment?: string): Promise<DeploymentRequestDto> {
    return apiClient.post<DeploymentRequestDto>(
      `/api/requests/${id}/reject`,
      comment ? { comment } : {},
    )
  },

  async requestChanges(id: number, comment: string): Promise<DeploymentRequestDto> {
    return apiClient.post<DeploymentRequestDto>(`/api/requests/${id}/request-changes`, {
      comment,
    })
  },

  // DRAFT or CHANGES_REQUESTED → PENDING_APPROVAL (BE §4 / live swagger).
  async submit(id: number): Promise<DeploymentRequestDto> {
    return apiClient.post<DeploymentRequestDto>(`/api/requests/${id}/submit`)
  },

  // File bytes live on Storage (swagger "Storage" tag). The request-scoped
  // GET /api/requests/{id}/file currently 500s (S3 key missing), so create
  // uploads to Storage first, then creates the request via multipart with
  // status=PENDING_APPROVAL in one shot (live create accepts that status).
  async createAndSubmit(input: CreateRequestInput): Promise<DeploymentRequestDto> {
    const uploaded = await storageApi.upload(input.userId, input.file, STORAGE_PREFIX)
    const created = await requestsApi.create({
      ...input,
      status: "PENDING_APPROVAL",
    })
    return withStorageCoords(created, uploaded)
  },

  async downloadFile(id: number): Promise<Blob> {
    return apiClient.getBlob(`/api/requests/${id}/file`)
  },

  async replaceFile(id: number, file: File): Promise<void> {
    const form = new FormData()
    form.append("file", file)
    await apiClient.putForm<void>(`/api/requests/${id}/file`, form)
  },
}
