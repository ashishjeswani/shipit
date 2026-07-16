import { MOCK_HISTORY } from "@/lib/mock/history"
import type { HistoryEntry } from "@/lib/types/api"

export function useRequestHistory(id: number): {
  data: HistoryEntry[]
  isLoading: false
  error: null
} {
  return { data: MOCK_HISTORY[id] ?? [], isLoading: false, error: null }
}
