export function ReviewingBanner({ reviewerName }: { reviewerName: string }) {
  return (
    <div className="rounded-2xl bg-secondary px-4 py-2 text-xs text-secondary-foreground">
      {reviewerName} is currently reviewing this request.
    </div>
  )
}
