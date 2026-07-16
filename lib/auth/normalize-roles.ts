import type { Role } from "@/lib/constants"

// The live backend's role strings are inconsistent depending on how an
// account was provisioned — seed data uses ROLE_DEV/ROLE_REVIEWER/ROLE_ADMIN,
// self-registered accounts get plain DEVELOPER (confirmed by smoke-testing
// GET /api/users against the live backend on 2026-07-16; every account there
// currently holds exactly one role — no dual-role account exists yet to
// verify the union case against). Normalized here so the rest of the app only
// ever deals with the app's own Role type. ROLE_ADMIN is treated as holding
// both capabilities since the seed data doesn't say otherwise and "admin"
// implies the union.
export function normalizeRoles(rawRoles: string[]): Role[] {
  const roles = new Set<Role>()
  for (const raw of rawRoles) {
    if (raw === "DEVELOPER" || raw === "ROLE_DEV") roles.add("DEVELOPER")
    if (raw === "APPROVER" || raw === "ROLE_REVIEWER") roles.add("APPROVER")
    if (raw === "ROLE_ADMIN") {
      roles.add("DEVELOPER")
      roles.add("APPROVER")
    }
  }
  return [...roles]
}
