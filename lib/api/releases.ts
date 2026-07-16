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
    status: dto.releaseStatus,
    requestCount: dto.requestCount,
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
