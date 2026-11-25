import { Button } from '@heroui/react'
import { useQueryClient } from '@tanstack/react-query'
import { useRef, useState } from 'react'
import { Link } from 'react-router'
import { Banner } from '@/components/ui/Banner'
import { ConfirmModal } from '@/components/ui/ConfirmModal'
import { Section } from '@/components/ui/Section'
import { recordQueryKey } from '@/features/records/api/records-api'
import { useNextReview, useReviewListing, readBackListing } from '@/features/reviews/api/useReviews'
import { DecisionSummary } from '@/features/reviews/components/DecisionSummary'
import { ReviewDialog, type ReviewDialogMode } from '@/features/reviews/components/ReviewDialog'
import { toApiError } from '@/lib/api/api-error'
import { errorMessage, isConflict } from '@/lib/api/error-message'
import { newIdempotencyKey } from '@/lib/api/idempotency'
import type { ListingDetail } from '@/lib/api/types/records'
import { ROLE_LABELS } from '@/lib/copy/labels'
import { REVIEW_COPY } from '@/lib/copy/review'
import { formatWait } from '@/lib/time/time'
import { useNow } from '@/hooks/useNow'
import { useSessionStore } from '@/stores/session'

type Outcome = { tone: 'success' | 'warning' | 'error'; title: string; next: boolean; retry?: boolean }

/** What the review queue was waiting on next, once this listing is decided */
function NextListing({ id }: { id: string }) {
  const { nextId, isPending, isError } = useNextReview(id, true)
  if (isPending || isError) return null
  if (!nextId) return <p className="text-compact text-muted">{REVIEW_COPY.lastOne}</p>
  return (
    <Link to={`/records/listings/${nextId}`} className="text-compact font-medium text-action underline">
      {REVIEW_COPY.reviewNext}
    </Link>
  )
}

/**
 * Listing review on the listing page (design 2026-11-24 §5.2): approve or reject while it waits, then the
 * decision, and for administrators, overturning it once.
 */
export function ReviewPanel({ listing }: { listing: ListingDetail }) {
  const review = listing.review!
  const queryClient = useQueryClient()
  const { displayName, roles } = useSessionStore()
  const isAdmin = roles.includes('administrator')
  const approve = useReviewListing(listing.id)
  const [outcome, setOutcome] = useState<Outcome | null>(null)
  const [approveKey, setApproveKey] = useState<string | null>(null)
  // Kept until the approval is known to be recorded, so Try again can't record it twice
  const sentKey = useRef<string | null>(null)
  const [dialog, setDialog] = useState<{ mode: ReviewDialogMode; opening: number } | null>(null)
  const pending = review.decision === null
  const now = useNow()
  const actor = `${displayName ?? 'You'} (${roles.map((r) => ROLE_LABELS[r]).join(', ')})`

  const conflict = () => {
    setOutcome({ tone: 'warning', title: REVIEW_COPY.conflict, next: false })
    void queryClient.invalidateQueries({ queryKey: recordQueryKey('listings', listing.id) })
  }

  async function confirmApprove() {
    try {
      sentKey.current ??= approveKey
      await approve.mutateAsync({
        body: { decision: 'approve', expectedVersion: listing.version },
        idempotencyKey: sentKey.current!,
      })
      sentKey.current = null
      setOutcome({ tone: 'success', title: REVIEW_COPY.approvedBanner(listing.id), next: true })
    } catch (error) {
      if (isConflict(error)) {
        sentKey.current = null
        return conflict()
      }
      if (toApiError(error).isOutcomeUnknown) {
        const fresh = await readBackListing(queryClient, listing.id)
        const decision = fresh?.review?.decision
        if (decision?.decision === 'approved' && decision.by === displayName) {
          sentKey.current = null
          setOutcome({ tone: 'success', title: REVIEW_COPY.approvedBanner(listing.id), next: true })
          return
        }
        setOutcome({ tone: 'error', title: REVIEW_COPY.unconfirmed, next: false, retry: true })
        return
      }
      sentKey.current = null
      setOutcome({ tone: 'error', title: errorMessage(error, "The decision wasn't recorded."), next: false })
    }
  }

  const openDialog = (mode: ReviewDialogMode) => setDialog((d) => ({ mode, opening: (d?.opening ?? 0) + 1 }))
  const overturnMode: ReviewDialogMode | null =
    review.decision?.decision === 'approved' ? 'overturn_approval' : review.decision ? 'overturn_rejection' : null

  return (
    <Section title="Review">
      {outcome && (
        <Banner
          key={outcome.title}
          tone={outcome.tone}
          title={outcome.title}
          focusOnShow
          action={
            outcome.retry ? (
              <Button size="sm" variant="secondary" onPress={() => void confirmApprove()}>
                Try again
              </Button>
            ) : undefined
          }
        >
          {outcome.next && <NextListing id={listing.id} />}
        </Banner>
      )}

      {pending ? (
        <>
          <p className="text-body text-ink">
            {REVIEW_COPY.waitingSince(review.submittedAt, formatWait(review.submittedAt, now))}
          </p>
          {review.previousRejection && (
            <p className="text-body text-muted">
              {REVIEW_COPY.resubmitted(
                review.previousRejection.at,
                review.previousRejection.reasonLabel,
                review.previousRejection.sellerMessage,
              )}
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            <Button onPress={() => setApproveKey(newIdempotencyKey())}>Approve</Button>
            <Button variant="danger" onPress={() => openDialog('reject')}>
              Reject
            </Button>
          </div>
        </>
      ) : (
        <>
          <DecisionSummary review={review} />
          {isAdmin && overturnMode && review.canOverturn && (
            <div>
              <Button variant="secondary" onPress={() => openDialog(overturnMode)}>
                {overturnMode === 'overturn_approval' ? 'Overturn approval' : 'Overturn rejection'}
              </Button>
            </div>
          )}
          {isAdmin && !review.canOverturn && review.overturnBlockedReason && (
            <p className="text-compact text-muted">{review.overturnBlockedReason}</p>
          )}
        </>
      )}

      <ConfirmModal
        open={approveKey !== null}
        onOpenChange={(next) => !next && setApproveKey(null)}
        title={REVIEW_COPY.approveTitle(listing.id)}
        actor={actor}
        target={`${listing.title} (${listing.id})`}
        consequence={REVIEW_COPY.approveConsequence}
        confirmLabel="Approve"
        tone="standard"
        onConfirm={confirmApprove}
      />
      {dialog && (
        <ReviewDialog
          key={dialog.opening}
          mode={dialog.mode}
          listing={listing}
          open
          onOpenChange={(next) => !next && setDialog(null)}
          onConflict={conflict}
          onDone={() =>
            setOutcome(
              dialog.mode === 'reject'
                ? { tone: 'success', title: REVIEW_COPY.rejectedBanner(listing.id), next: true }
                : { tone: 'success', title: REVIEW_COPY.overturnedBanner, next: false },
            )
          }
        />
      )}
    </Section>
  )
}
