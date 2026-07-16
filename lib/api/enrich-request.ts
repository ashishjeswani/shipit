import { canOpenRequest, isOwner } from "@/lib/auth/capabilities"
import type { DeploymentRequestDto, DeploymentRequestListItem, User, UserSummary } from "@/lib/types/api"

function unknownUser(id: number): UserSummary {
  return { id, name: `User #${id}` }
}

// Projects a raw DeploymentRequestDto (ownerId/assignedReviewerId as bare
// numbers, per the live BE) into the enriched, viewer-scoped shape components
// expect — resolving ids against the fetched users list and computing
// locked/mine from the local pretend-auth user (lib/auth/capabilities.ts).
// Shared by use-requests.ts (list) and use-request.ts (detail) since the BE
// returns the identical DTO shape for both.
export function enrichRequest(
  dto: DeploymentRequestDto,
  usersById: Map<number, UserSummary>,
  currentUser: User | null,
): DeploymentRequestListItem {
  const owner = usersById.get(dto.ownerId) ?? unknownUser(dto.ownerId)
  const assignedReviewer =
    dto.assignedReviewerId != null
      ? (usersById.get(dto.assignedReviewerId) ?? unknownUser(dto.assignedReviewerId))
      : null
  const scoped = { owner, assignedReviewer }

  return {
    id: dto.id,
    releaseId: dto.releaseId,
    title: dto.title,
    status: dto.requestStatus,
    owner,
    assignedReviewer,
    reviewingBy: null, // no presence signal exists yet — WS/notifications are out of scope
    createdAt: dto.createdAt,
    locked: !canOpenRequest(currentUser, scoped),
    mine: isOwner(currentUser, scoped),
  }
}
