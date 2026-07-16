import { create } from "zustand"

import { mockUsers } from "@/lib/mock/data"
import type { User } from "@/lib/types/api"

// Mock-data pass: no real login flow yet (see docs/frontend/07-auth-and-permissions.md).
// Holds the "logged in as" user so screens can be built role-aware before
// lib/api/auth.ts + real sessions exist.
interface AuthStore {
  currentUser: User
  setCurrentUser: (user: User) => void
}

export const useAuthStore = create<AuthStore>((set) => ({
  currentUser: mockUsers.find((user) => user.username === "carol") ?? mockUsers[0],
  setCurrentUser: (user) => set({ currentUser: user }),
}))
