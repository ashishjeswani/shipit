import type { User } from "@/lib/types/api"

export const MOCK_USERS: Record<"developer" | "approver" | "dual", User> = {
  developer: { id: 1, name: "Dana Developer", username: "dana", roles: ["DEVELOPER"] },
  approver: { id: 2, name: "Carol Approver", username: "carol", roles: ["APPROVER"] },
  dual: { id: 3, name: "Sam Dual", username: "sam", roles: ["DEVELOPER", "APPROVER"] },
}

export type MockUserKey = keyof typeof MOCK_USERS

