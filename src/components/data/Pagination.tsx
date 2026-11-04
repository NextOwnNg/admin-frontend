import { ChevronLeft, ChevronRight } from 'lucide-react'
import { PlainButton } from '@/components/ui/Button'

/** Cursor paging: a count and Previous / Next (design §4.2). */
export function Pagination({
  label,
  shown,
  total,
  hasNext,
  hasPrevious,
  onNext,
  onPrevious,
}: {
  label: string
  shown: number
  total: number
  hasNext: boolean
  hasPrevious: boolean
  onNext: () => void
  onPrevious: () => void
}) {
  return (
    <nav aria-label={`${label} pages`} className="flex flex-wrap items-center justify-between gap-3">
      <p className="text-compact text-muted tabular-nums">
        Showing {shown} of {total}
      </p>
      <div className="flex gap-2">
        <PlainButton variant="secondary" size="compact" disabled={!hasPrevious} onClick={onPrevious}>
          <ChevronLeft aria-hidden className="size-4" />
          Previous page
        </PlainButton>
        <PlainButton variant="secondary" size="compact" disabled={!hasNext} onClick={onNext}>
          Next page
          <ChevronRight aria-hidden className="size-4" />
        </PlainButton>
      </div>
    </nav>
  )
}
