import type { ListingRow } from '@/lib/api/types/records'

/** Listing review (design 2026-11-24 §7). Hand-written until the OpenAPI spec lands. */

export type PreviousRejection = { at: string; reasonCode: string; reasonLabel: string; sellerMessage: string | null }

/** `GET /admin/listing-reviews`: a listing waiting for review */
export type ListingReviewRow = ListingRow & { submittedAt: string; previousRejection: PreviousRejection | null }

export type ReviewDecision = {
  decision: 'approved' | 'rejected'
  /** Staff display name */
  by: string
  at: string
  /** Null for an approval */
  reasonCode: string | null
  reasonLabel: string | null
  sellerMessage: string | null
  /** Internal; staff only */
  note: string | null
}

export type ReviewOverturn = {
  by: string
  at: string
  reasonCode: string
  reasonLabel: string
  sellerMessage: string | null
  note: string | null
}

export type ListingReview = {
  submittedAt: string
  previousRejection: PreviousRejection | null
  /** Null while pending */
  decision: ReviewDecision | null
  /** At most one per review round */
  overturn: ReviewOverturn | null
  canOverturn: boolean
  overturnBlockedReason: string | null
}

/** Signed and short-lived; ordered */
export type ListingPhoto = { id: string; url: string; expiresAt: string; width: number; height: number }

export type ItemCondition = {
  condition: string
  defects: string | null
  repairs: string | null
  ownershipDeclared: boolean
}

/** `POST /admin/listings/:id/review` */
export type ReviewBody = {
  decision: 'approve' | 'reject'
  expectedVersion: number
  reasonCode?: string
  sellerMessage?: string
  note?: string
}

/** `POST /admin/listings/:id/review/overturn` (administrators) */
export type OverturnBody = { expectedVersion: number; reasonCode: string; sellerMessage?: string; note?: string }
