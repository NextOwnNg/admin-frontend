import { ClipboardCheck, SearchX } from 'lucide-react'
import { useNavigate } from 'react-router'
import { z } from 'zod'
import { FilterBar, type FilterChip } from '@/components/data/FilterBar'
import { SingleFilter } from '@/components/data/FilterControls'
import { Pagination } from '@/components/data/Pagination'
import { PageHead } from '@/components/seo/PageHead'
import { PlainButton } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/States'
import { PLACE_NAME, useAreaOptions, useCategoryOptions } from '@/features/records/filter-options'
import { useListingReviews } from '@/features/reviews/api/useReviews'
import { ReviewQueueTable } from '@/features/reviews/components/ReviewQueueTable'
import { useCursorStack } from '@/hooks/useCursorStack'
import { useNow } from '@/hooks/useNow'
import { CURSOR, useUrlFilters } from '@/hooks/useUrlFilters'
import { isForbidden } from '@/lib/api/error-message'
import { REVIEW_COPY } from '@/lib/copy/review'
import { formatWait } from '@/lib/time/time'

const queueSchema = z.object({
  category: z.string().regex(PLACE_NAME).optional(),
  area: z.string().regex(PLACE_NAME).optional(),
  cursor: CURSOR.optional(),
})

/** Listings waiting for review, oldest first (design 2026-11-24 §5.1) */
export function ListingReviewsPage() {
  const navigate = useNavigate()
  const now = useNow()
  const { filters, present, setFilter, clear } = useUrlFilters(queueSchema)
  const pages = useCursorStack(filters)
  const queue = useListingReviews(filters)
  const categories = useCategoryOptions()
  const areas = useAreaOptions()
  const page = queue.data
  const status = queue.isPending
    ? 'pending'
    : isForbidden(queue.error)
      ? 'forbidden'
      : queue.isError
        ? 'error'
        : 'success'

  const chips: FilterChip[] = [
    ...(present.category
      ? [{ key: 'category', label: `Category: ${present.category}`, onRemove: () => setFilter('category', undefined) }]
      : []),
    ...(present.area
      ? [{ key: 'area', label: `Area: ${present.area}`, onRemove: () => setFilter('area', undefined) }]
      : []),
  ]
  const filtered = chips.length > 0
  const oldest = page?.items[0]
  const subtitle =
    page && !filtered && !pages.hasPrevious
      ? REVIEW_COPY.subtitle(page.total, oldest ? formatWait(oldest.submittedAt, now) : null)
      : null

  return (
    <>
      <PageHead title={REVIEW_COPY.heading} />
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-1">
          <h1 className="text-h1 text-ink">{REVIEW_COPY.heading}</h1>
          {subtitle && <p className="text-body text-muted tabular-nums">{subtitle}</p>}
        </div>

        <FilterBar chips={chips} onClear={clear}>
          <SingleFilter
            label="Category"
            options={categories}
            value={present.category}
            onChange={(v) => setFilter('category', v)}
          />
          <SingleFilter label="Area" options={areas} value={present.area} onChange={(v) => setFilter('area', v)} />
        </FilterBar>

        <ReviewQueueTable
          rows={page?.items}
          status={status}
          now={now}
          onRetry={() => void queue.refetch()}
          rowActions={(row) => [
            { label: 'Open listing', onAction: () => void navigate(`/records/listings/${row.id}`) },
          ]}
          empty={
            filtered ? (
              <EmptyState
                icon={SearchX}
                title="No waiting listings match these filters"
                body="Try fewer filters, or clear them to see the whole queue."
                action={
                  <PlainButton variant="secondary" onClick={clear}>
                    Clear filters
                  </PlainButton>
                }
              />
            ) : (
              <EmptyState
                icon={ClipboardCheck}
                title={REVIEW_COPY.empty}
                body="New listings appear here as sellers submit them."
              />
            )
          }
        />

        {page && page.items.length > 0 && (
          <Pagination
            label={REVIEW_COPY.heading}
            shown={page.items.length}
            total={page.total}
            hasNext={Boolean(page.nextCursor)}
            hasPrevious={pages.hasPrevious}
            onNext={() => {
              pages.push()
              setFilter('cursor', page.nextCursor ?? undefined)
            }}
            onPrevious={() => setFilter('cursor', pages.pop())}
          />
        )}
      </div>
    </>
  )
}
