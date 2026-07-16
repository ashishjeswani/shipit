import { canOpenRequest, isOwner } from "@/lib/auth/capabilities"
import type {
  DeploymentRequestDetail,
  DeploymentRequestDto,
  User,
  UserSummary,
} from "@/lib/types/api"

function unknownUser(id: number): UserSummary {
  return { id, name: `User #${id}` }
}

// Prefer the embedded UserSummary the live BE returns (DeploymentRequestReadDto
// embeds owner/assignedReviewer). Fall back to bare ids + the users list for
// older payloads that only sent ownerId/assignedReviewerId.
function resolveUser(
  embedded: UserSummary | null | undefined,
  id: number | null | undefined,
  usersById: Map<number, UserSummary>,
): UserSummary | null {
  if (embedded?.id != null) {
    const name =
      embedded.name || usersById.get(embedded.id)?.name || `User #${embedded.id}`
    return { id: embedded.id, name }
  }
  if (id != null) {
    return usersById.get(id) ?? unknownUser(id)
  }
  return null
}

// Projects a raw DeploymentRequestDto into the enriched, viewer-scoped shape
// components expect — resolving owner/reviewer display names and computing
// locked/mine when the BE hasn't already stamped them.
// Shared by use-requests.ts (list) and use-request.ts (detail).
export function enrichRequest(
  dto: DeploymentRequestDto,
  usersById: Map<number, UserSummary>,
  currentUser: User | null,
): DeploymentRequestDetail {
  const owner =
    resolveUser(dto.owner, dto.ownerId, usersById) ?? unknownUser(dto.ownerId ?? 0)
  const assignedReviewer = resolveUser(
    dto.assignedReviewer,
    dto.assignedReviewerId,
    usersById,
  )
  const scoped = { owner, assignedReviewer }

  return {
    id: dto.id,
    releaseId: dto.releaseId,
    title: dto.title,
    status: dto.status ?? dto.requestStatus ?? "DRAFT",
    owner,
    assignedReviewer,
    reviewingBy: dto.reviewingBy ?? null,
    unreadMessages: dto.unreadMessages,
    createdAt: dto.createdAt,
    updatedAt: dto.updatedAt,
    description: dto.description,
    file: dto.file ?? undefined,
    // Prefer the BE's locked flag when present; otherwise recompute from the
    // assigned-reviewer rule (lib/auth/capabilities.ts).
    locked: dto.locked ?? !canOpenRequest(currentUser, scoped),
    mine: isOwner(currentUser, scoped),
  }
}
