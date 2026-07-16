import { MOCK_MESSAGES } from "@/lib/mock/messages"
import type { ConversationMessage } from "@/lib/types/api"

export function useRequestMessages(id: number): {
  data: ConversationMessage[]
  isLoading: false
  error: null
} {
  return { data: MOCK_MESSAGES[id] ?? [], isLoading: false, error: null }
}
