import { apiClient } from "@/lib/api/client"
import type { ReleaseStatus } from "@/lib/constants"
import type { Release, ReleaseDto } from "@/lib/types/api"

interface Page<T> {
  content: T[]
}

function fromDto(dto: ReleaseDto): Release {
  return {
    id: dto.id,
    name: dto.name,
    description: dto.description,
    // Accept either field name (see ReleaseDto note). Fall back to OPEN — the
    // BE's own documented default for a status-less release (BACKEND_API_GUIDE
    // §create) — so a malformed payload degrades to a safe value instead of
    // undefined crashing every status consumer downstream.
    status: dto.releaseStatus ?? dto.status ?? "OPEN",
    createdBy: dto.createdBy ?? null,
    approvers: dto.approvers ?? [],
    requestCount: dto.requestCount,
    myRequestCount: dto.myRequestCount ?? undefined,
    createdAt: dto.createdAt,
  }
}

export interface CreateReleaseInput {
  name: string
  description?: string
  status?: ReleaseStatus
  approverIds?: number[]
}

export const releasesApi = {
  async list(): Promise<Release[]> {
    const page = await apiClient.get<Page<ReleaseDto>>(
      "/api/releases?page=0&size=200&sort=createdAt,desc",
    )
    return page.content.map(fromDto)
  },

  async get(id: number): Promise<Release> {
    return fromDto(await apiClient.get<ReleaseDto>(`/api/releases/${id}`))
  },

  async create(input: CreateReleaseInput): Promise<Release> {
    return fromDto(await apiClient.post<ReleaseDto>("/api/releases", input))
  },

  // BE §3's PATCH .../status is a plain PUT on the live deployment — the
  // generic ReleaseUpdateDto only carries `status` anyway, so it's equivalent.
  async updateStatus(id: number, status: ReleaseStatus): Promise<Release> {
    return fromDto(await apiClient.put<ReleaseDto>(`/api/releases/${id}`, { status }))
  },
}
