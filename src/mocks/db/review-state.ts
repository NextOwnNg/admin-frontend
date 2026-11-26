import type { ListingReview } from '@/lib/api/types/reviews'
import { store } from '@/mocks/db/store'
import type { ListingRec } from '@/mocks/records-seed'

/** Why a decision can't be overturned (design 2026-11-24 §6.2, §6.3a); null when it can */
export function overturnBlockedReason(l: ListingRec): string | null {
  const review = l.review
  if (!review?.decision) return null
  if (review.overturn) return 'Already overturned once.'
  if (review.decision.decision === 'approved') {
    const accepted = store().records.offers.some((o) => o.listingId === l.id && o.status === 'ACCEPTED')
    if (accepted) return "Can't be overturned: an offer on it was accepted."
    if (l.status !== 'ACTIVE') return "Can't be overturned: it's no longer live."
    return null
  }
  if (review.changedSince || l.status !== 'DRAFT') return "Can't be overturned: the seller has changed it since."
  return null
}

/** The review as the API shows it, or null for a listing that never went through review */
export function reviewOf(l: ListingRec): ListingReview | null {
  if (!l.review || !l.submittedAt) return null
  const blocked = overturnBlockedReason(l)
  const decided = Boolean(l.review.decision)
  return structuredClone({
    submittedAt: l.submittedAt,
    previousRejection: l.review.previousRejection,
    decision: l.review.decision,
    overturn: l.review.overturn,
    canOverturn: decided && blocked === null,
    overturnBlockedReason: decided ? blocked : null,
  })
}
