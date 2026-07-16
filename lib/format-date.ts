const RELATIVE_UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ["year", 60 * 60 * 24 * 365],
  ["month", 60 * 60 * 24 * 30],
  ["week", 60 * 60 * 24 * 7],
  ["day", 60 * 60 * 24],
  ["hour", 60 * 60],
  ["minute", 60],
]

const relativeFormatter = new Intl.RelativeTimeFormat("en", { numeric: "auto" })

export function formatRelativeTime(iso: string, now: Date = new Date()): string {
  const deltaSeconds = Math.round((new Date(iso).getTime() - now.getTime()) / 1000)
  const absSeconds = Math.abs(deltaSeconds)

  if (absSeconds < 60) {
    return "just now"
  }

  for (const [unit, secondsInUnit] of RELATIVE_UNITS) {
    if (absSeconds >= secondsInUnit) {
      return relativeFormatter.format(Math.round(deltaSeconds / secondsInUnit), unit)
    }
  }

  return relativeFormatter.format(Math.round(deltaSeconds / 60), "minute")
}

export function formatAbsoluteTime(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  })
}
