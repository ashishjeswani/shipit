import { create } from "zustand"

import type { User } from "@/lib/types/api"

interface AuthState {
  user: User | null
  status: "loading" | "authenticated" | "unauthenticated"
  setUser: (user: User) => void
  clear: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  status: "loading",
  setUser: (user) => set({ user, status: "authenticated" }),
  clear: () => set({ user: null, status: "unauthenticated" }),
}))
