import { Card, CardContent } from "@/components/ui/card"

interface StatTileProps {
  label: string
  value: number
}

export function StatTile({ label, value }: StatTileProps) {
  return (
    <Card size="sm">
      <CardContent className="flex flex-col gap-1">
        <span className="text-2xl font-semibold tabular-nums">{value}</span>
        <span className="text-xs text-muted-foreground">{label}</span>
      </CardContent>
    </Card>
  )
}
