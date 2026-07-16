import type { HistoryEntry } from "@/lib/types/api"

const EVENT_LABELS: Record<string, string> = {
  CREATED: "Created",
  SUBMITTED: "Submitted for approval",
  RESUBMITTED: "Resubmitted",
  CHANGES_REQUESTED: "Changes requested",
  FILE_REPLACED: "File replaced",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  REVIEW_STARTED: "Review started",
  REVIEW_STOPPED: "Review stopped",
}

function formatTimestamp(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })
}

export function HistoryTimeline({ entries }: { entries: HistoryEntry[] }) {
  if (entries.length === 0) {
    return <p className="text-sm text-muted-foreground">No history yet.</p>
  }

  return (
    <ol className="flex flex-col gap-3">
      {entries.map((entry, index) => (
        <li key={`${entry.event}-${entry.at}-${index}`} className="flex items-start gap-3">
          <div className="mt-1.5 size-1.5 shrink-0 rounded-full bg-muted-foreground" />
          <div className="flex flex-col text-sm">
            <span>
              <span className="font-medium">{entry.by.name}</span>{" "}
              {(EVENT_LABELS[entry.event] ?? entry.event).toLowerCase()}
            </span>
            <span className="text-xs text-muted-foreground">{formatTimestamp(entry.at)}</span>
          </div>
        </li>
      ))}
    </ol>
  )
}
