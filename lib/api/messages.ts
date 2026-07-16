import { apiClient } from "@/lib/api/client"
import type { MessageDto } from "@/lib/types/api"

// Conversation thread for a deployment request (BE §5 / live swagger
// "Conversations" tag). Linear text only — no nesting.
export const messagesApi = {
  async list(requestId: number): Promise<MessageDto[]> {
    return apiClient.get<MessageDto[]>(`/api/requests/${requestId}/messages`)
  },

  async create(requestId: number, text: string): Promise<MessageDto> {
    return apiClient.post<MessageDto>(`/api/requests/${requestId}/messages`, { text })
  },

  // Clears unreadMessages on the request list for the caller. Live swagger
  // returns 200; guide §5 says 204 — apiClient handles both.
  async markRead(requestId: number): Promise<void> {
    await apiClient.post<void>(`/api/requests/${requestId}/messages/mark-read`)
  },
}
