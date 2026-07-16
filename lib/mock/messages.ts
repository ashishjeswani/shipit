import type { ConversationMessage } from "@/lib/types/api"
import { MOCK_USERS } from "@/lib/mock/users"

export const MOCK_MESSAGES: Record<number, ConversationMessage[]> = {
  101: [
    {
      id: 1001,
      requestId: 101,
      sender: null,
      text: "Dana Developer submitted this request for approval.",
      system: true,
      createdAt: "2026-07-14T09:00:00Z",
    },
    {
      id: 1002,
      requestId: 101,
      sender: MOCK_USERS.approver,
      text: "Can you confirm this only touches the v2 flag path, not the legacy gateway?",
      system: false,
      createdAt: "2026-07-14T13:00:00Z",
    },
    {
      id: 1003,
      requestId: 101,
      sender: MOCK_USERS.developer,
      text: "Correct — the legacy path is untouched, this is fully behind `payments_v2_enabled`.",
      system: false,
      createdAt: "2026-07-14T13:20:00Z",
    },
  ],
  104: [
    {
      id: 1010,
      requestId: 104,
      sender: null,
      text: "Dana Developer submitted this request for approval.",
      system: true,
      createdAt: "2026-07-16T08:15:00Z",
    },
    {
      id: 1011,
      requestId: 104,
      sender: MOCK_USERS.approver,
      text: "Reviewing now, looks straightforward.",
      system: false,
      createdAt: "2026-07-16T08:42:00Z",
    },
  ],
  105: [
    {
      id: 1020,
      requestId: 105,
      sender: null,
      text: "Sam Dual submitted this request for approval.",
      system: true,
      createdAt: "2026-07-10T10:00:00Z",
    },
    {
      id: 1021,
      requestId: 105,
      sender: MOCK_USERS.approver,
      text: "Please add a rollback step in case the Redis migration fails mid-flight.",
      system: false,
      createdAt: "2026-07-10T15:00:00Z",
    },
    {
      id: 1022,
      requestId: 105,
      sender: MOCK_USERS.dual,
      text: "Added — resubmitted with a fallback to the in-memory cache on connect failure.",
      system: false,
      createdAt: "2026-07-11T09:00:00Z",
    },
    {
      id: 1023,
      requestId: 105,
      sender: null,
      text: "Carol Approver approved this request.",
      system: true,
      createdAt: "2026-07-11T09:20:00Z",
    },
  ],
  106: [
    {
      id: 1030,
      requestId: 106,
      sender: null,
      text: "Dana Developer submitted this request for approval.",
      system: true,
      createdAt: "2026-06-30T16:45:00Z",
    },
    {
      id: 1031,
      requestId: 106,
      sender: MOCK_USERS.approver,
      text: "We still have a dependency on this runner from the billing job — rejecting for now.",
      system: false,
      createdAt: "2026-07-01T11:50:00Z",
    },
    {
      id: 1032,
      requestId: 106,
      sender: null,
      text: "Carol Approver rejected this request.",
      system: true,
      createdAt: "2026-07-01T12:00:00Z",
    },
  ],
}
