import type { LucideIcon } from "lucide-react"

import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

export type StatTone = "neutral" | "sky" | "amber" | "emerald" | "orange" | "rose"

const TONE_STYLES: Record<StatTone, string> = {
  neutral: "bg-muted text-muted-foreground",
  sky: "bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-400",
  amber: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400",
  emerald: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400",
  orange: "bg-orange-100 text-orange-700 dark:bg-orange-500/15 dark:text-orange-400",
  rose: "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-400",
}

export function StatCard({
  label,
  value,
  icon: Icon,
  tone = "neutral",
}: {
  label: string
  value: number
  icon: LucideIcon
  tone?: StatTone
}) {
  return (
    <Card size="sm">
      <CardContent className="flex items-center gap-3">
        <div
          className={cn(
            "flex size-9 shrink-0 items-center justify-center rounded-full",
            TONE_STYLES[tone],
          )}
        >
          <Icon className="size-4" />
        </div>
        <div className="flex flex-col">
          <span className="font-heading text-lg leading-none font-semibold">{value}</span>
          <span className="text-xs text-muted-foreground">{label}</span>
        </div>
      </CardContent>
    </Card>
  )
}
