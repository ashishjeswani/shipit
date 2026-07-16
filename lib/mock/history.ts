import type { HistoryEntry } from "@/lib/types/api"
import { MOCK_USERS } from "@/lib/mock/users"

export const MOCK_HISTORY: Record<number, HistoryEntry[]> = {
  101: [
    { at: "2026-07-13T10:00:00Z", by: MOCK_USERS.developer, event: "CREATED" },
    { at: "2026-07-14T09:00:00Z", by: MOCK_USERS.developer, event: "SUBMITTED" },
  ],
  102: [{ at: "2026-07-15T11:30:00Z", by: MOCK_USERS.developer, event: "CREATED" }],
  103: [
    { at: "2026-07-15T13:00:00Z", by: MOCK_USERS.dual, event: "CREATED" },
    { at: "2026-07-15T14:00:00Z", by: MOCK_USERS.dual, event: "SUBMITTED" },
  ],
  104: [
    { at: "2026-07-15T20:00:00Z", by: MOCK_USERS.developer, event: "CREATED" },
    { at: "2026-07-16T08:15:00Z", by: MOCK_USERS.developer, event: "SUBMITTED" },
    { at: "2026-07-16T08:40:00Z", by: MOCK_USERS.approver, event: "REVIEW_STARTED" },
  ],
  105: [
    { at: "2026-07-09T09:00:00Z", by: MOCK_USERS.dual, event: "CREATED" },
    { at: "2026-07-10T10:00:00Z", by: MOCK_USERS.dual, event: "SUBMITTED" },
    {
      at: "2026-07-10T15:00:00Z",
      by: MOCK_USERS.approver,
      event: "CHANGES_REQUESTED",
    },
    { at: "2026-07-11T09:00:00Z", by: MOCK_USERS.dual, event: "RESUBMITTED" },
    { at: "2026-07-11T09:20:00Z", by: MOCK_USERS.approver, event: "APPROVED" },
  ],
  106: [
    { at: "2026-06-29T09:00:00Z", by: MOCK_USERS.developer, event: "CREATED" },
    { at: "2026-06-30T16:45:00Z", by: MOCK_USERS.developer, event: "SUBMITTED" },
    { at: "2026-07-01T12:00:00Z", by: MOCK_USERS.approver, event: "REJECTED" },
  ],
}
