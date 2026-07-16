import { formatAbsoluteTime, formatRelativeTime } from "@/lib/format-date"

export function RelativeTime({ iso, className }: { iso: string; className?: string }) {
  return (
    <time dateTime={iso} title={formatAbsoluteTime(iso)} className={className}>
      {formatRelativeTime(iso)}
    </time>
  )
}
