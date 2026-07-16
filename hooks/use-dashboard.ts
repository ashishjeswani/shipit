import { useMemo } from "react"

import { getMockDashboard } from "@/lib/mock/data"
import { useAuthStore } from "@/stores/auth-store"

// GET /api/dashboard (BE §6). Returns mock data for now — no BE running yet.
// Keeps the `{ data, isLoading, error }` shape the real TanStack Query hook
// will use once lib/api/dashboard.ts exists, so swapping is a one-line change.
export function useDashboard() {
  const currentUser = useAuthStore((state) => state.currentUser)

  const data = useMemo(() => getMockDashboard(currentUser), [currentUser])

  return { data, isLoading: false, error: null }
}
