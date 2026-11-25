import { keepPreviousData, useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query'
import { invalidateAfterAction } from '@/features/actions/api/useCaseAction'
import { getRecordDetail, recordQueryKey } from '@/features/records/api/records-api'
import {
  getListingReviews,
  overturnReview,
  reviewListing,
  reviewsQueryKey,
  type ReviewFilters,
} from '@/features/reviews/api/reviews-api'
import type { ListingDetail } from '@/lib/api/types/records'
import type { OverturnBody, ReviewBody } from '@/lib/api/types/reviews'
import { useSessionStore } from '@/stores/session'

/** One page of the review queue */
export function useListingReviews(
  filters: ReviewFilters,
  options: { enabled?: boolean; refetchInterval?: number } = {},
) {
  return useQuery({
    queryKey: reviewsQueryKey(filters),
    queryFn: ({ signal }) => getListingReviews(filters, { signal }),
    placeholderData: keepPreviousData,
    ...options,
  })
}

/** How many listings wait, for the sidebar: read every minute, only for staff who review; null when unknown */
export function useWaitingCount(): number | null {
  const roles = useSessionStore((s) => s.roles)
  const reviews = roles.some((r) => r === 'moderator' || r === 'administrator')
  const queue = useListingReviews({}, { enabled: reviews, refetchInterval: 60_000 })
  return reviews && queue.data ? queue.data.total : null
}

/** The next waiting listing after this one, oldest first; null when none is left */
export function useNextReview(currentId: string, enabled: boolean) {
  const queue = useListingReviews({}, { enabled })
  const next = queue.data?.items.find((row) => row.id !== currentId)
  // A background refetch keeps the link in place; an unreadable queue claims nothing
  return { nextId: next?.id ?? null, isPending: queue.isPending, isError: queue.isError && !queue.data }
}

/** Everything a decision changes: the listing, the queue, the overview and the log */
function useAfterReview(id: string) {
  const queryClient = useQueryClient()
  return {
    onSuccess: (listing: ListingDetail) => queryClient.setQueryData(recordQueryKey('listings', id), listing),
    onSettled: () => invalidateAfterAction(queryClient, [recordQueryKey('listings', id), ['admin', 'listing-reviews']]),
  }
}

/** Approve or reject. Never retried: an uncertain outcome is read back first. */
export function useReviewListing(id: string) {
  return useMutation({
    mutationFn: ({ body, idempotencyKey }: { body: ReviewBody; idempotencyKey: string }) =>
      reviewListing(id, body, idempotencyKey),
    ...useAfterReview(id),
  })
}

/** Overturn a decision (administrators) */
export function useOverturnReview(id: string) {
  return useMutation({
    mutationFn: ({ body, idempotencyKey }: { body: OverturnBody; idempotencyKey: string }) =>
      overturnReview(id, body, idempotencyKey),
    ...useAfterReview(id),
  })
}

/**
 * After a lost answer: reads the listing on its own request, so a failed read never turns the page into its
 * error state. A fresh copy replaces the page's; null when it couldn't be read.
 */
export async function readBackListing(queryClient: QueryClient, id: string): Promise<ListingDetail | null> {
  try {
    const fresh = await getRecordDetail('listings', id)
    queryClient.setQueryData(recordQueryKey('listings', id), fresh)
    return fresh
  } catch {
    return null
  }
}
