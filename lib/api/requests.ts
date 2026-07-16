import { apiClient } from "@/lib/api/client"
import type { DeploymentRequestDto } from "@/lib/types/api"

interface Page<T> {
  content: T[]
}

export interface CreateRequestInput {
  title: string
  description: string
  releaseId: number
  assignedReviewerId?: number | null
}

// The live DeploymentRequestCreateDto only accepts {title, description} today
// (docs/BACKEND_API_GUIDE.md's releaseId/assignedReviewerId/file fields aren't
// on the deployed DTO yet, confirmed by smoke-testing the swagger on
// 2026-07-16 — the BE silently drops them). They're still sent here since the
// BE ignores unknown JSON fields rather than rejecting them, so this call
// becomes fully correct with zero FE changes once BE adds the fields.
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

  async create(input: CreateRequestInput): Promise<DeploymentRequestDto> {
    return apiClient.post<DeploymentRequestDto>("/api/deployment-requests", input)
  },

  // DeploymentRequestUpdateDto only has `title` today — no way to edit
  // description or replace the file via this endpoint yet.
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
}
