import type { Role } from "@/lib/constants"
import type { DeploymentRequestListItem, Release, User } from "@/lib/types/api"

export function hasRole(user: User | null, role: Role): boolean {
  return !!user?.roles.includes(role)
}

export function isOwner(
  user: User | null,
  request: Pick<DeploymentRequestListItem, "owner">,
): boolean {
  return user?.id === request.owner.id
}

// Mirrors BE §4 locked semantics: null assignedReviewer = any approver; else only that reviewer (or the owner).
export function canOpenRequest(
  user: User | null,
  request: Pick<DeploymentRequestListItem, "owner" | "assignedReviewer">,
): boolean {
  if (!user) return false
  if (isOwner(user, request)) return true
  if (!hasRole(user, "APPROVER")) return false
  return request.assignedReviewer === null || request.assignedReviewer.id === user.id
}

// Mirrors BE §9 "Any review action on own request" — the one rule that beats everything else.
export function canReview(
  user: User | null,
  request: Pick<DeploymentRequestListItem, "owner" | "assignedReviewer" | "status">,
): boolean {
  if (!user || isOwner(user, request)) return false
  if (!hasRole(user, "APPROVER")) return false
  // PENDING_APPROVAL is normalized to PENDING_REVIEW in enrich-request.
  if (request.status !== "PENDING_REVIEW") return false
  return canOpenRequest(user, request)
}

export function canCreateRelease(user: User | null): boolean {
  return hasRole(user, "APPROVER")
}

export function canCreateRequest(user: User | null, release: Pick<Release, "status">): boolean {
  return hasRole(user, "DEVELOPER") && release.status === "OPEN"
}

export function canEditRequest(
  user: User | null,
  request: Pick<DeploymentRequestListItem, "owner" | "status">,
): boolean {
  return (
    isOwner(user, request) && (request.status === "DRAFT" || request.status === "CHANGES_REQUESTED")
  )
}

// Owner may submit a draft (or resubmit after changes) → PENDING_APPROVAL (BE §4).
export function canSubmitRequest(
  user: User | null,
  request: Pick<DeploymentRequestListItem, "owner" | "status">,
): boolean {
  return canEditRequest(user, request)
}
