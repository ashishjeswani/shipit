export function LockedBanner({ reviewerName }: { reviewerName?: string }) {
  return (
    <div className="rounded-2xl bg-muted px-4 py-3 text-sm text-muted-foreground">
      This request is restricted to {reviewerName ?? "another reviewer"} for review.
    </div>
  )
}
