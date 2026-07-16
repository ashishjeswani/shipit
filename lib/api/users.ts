import { apiClient } from "@/lib/api/client"
import type { UserSummary } from "@/lib/types/api"

interface UserDto {
  id: number
  username: string
  name: string
  roles: string[]
}

interface Page<T> {
  content: T[]
}

// The live GET /api/users has no `role` filter (docs/BACKEND_API_GUIDE.md
// describes one, the deployed API ignores it) — fetched in bulk and used
// only to resolve a request's ownerId/assignedReviewerId to a display name.
// Role-based UI gating never reads these BE role strings (they use a
// different scheme — ROLE_DEV/ROLE_REVIEWER — than the app's Role type); it's
// driven entirely by the local pretend-auth user, see lib/auth/capabilities.ts.
export const usersApi = {
  async list(): Promise<UserSummary[]> {
    const page = await apiClient.get<Page<UserDto>>("/api/users?page=0&size=200")
    return page.content.map((u) => ({ id: u.id, name: u.name || u.username }))
  },
}
