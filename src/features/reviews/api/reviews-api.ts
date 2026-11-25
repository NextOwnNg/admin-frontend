import { apiClient } from '@/lib/api/client'
import { idempotencyHeaders } from '@/lib/api/idempotency'
import type { ListingDetail, RecordPage } from '@/lib/api/types/records'
import type { ListingReviewRow, OverturnBody, ReviewBody } from '@/lib/api/types/reviews'

/** Listing review (design 2026-11-24 §7) */

export type ReviewFilters = { category?: string; area?: string; cursor?: string }

export const reviewsQueryKey = (filters: ReviewFilters) => ['admin', 'listing-reviews', filters] as const

/** `GET /admin/listing-reviews`: waiting listings, oldest first */
export async function getListingReviews(filters: ReviewFilters, { signal }: { signal?: AbortSignal } = {}) {
  return (await apiClient.get<RecordPage<ListingReviewRow>>('/admin/listing-reviews', { params: filters, signal })).data
}

/** `POST /admin/listings/:id/review` */
export async function reviewListing(id: string, body: ReviewBody, idempotencyKey: string) {
  return (
    await apiClient.post<ListingDetail>(`/admin/listings/${id}/review`, body, {
      headers: idempotencyHeaders(idempotencyKey),
    })
  ).data
}

/** `POST /admin/listings/:id/review/overturn` (administrators) */
export async function overturnReview(id: string, body: OverturnBody, idempotencyKey: string) {
  return (
    await apiClient.post<ListingDetail>(`/admin/listings/${id}/review/overturn`, body, {
      headers: idempotencyHeaders(idempotencyKey),
    })
  ).data
}
