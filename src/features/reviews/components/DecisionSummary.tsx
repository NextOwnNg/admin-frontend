import type { ListingReview } from '@/lib/api/types/reviews'
import { formatWAT } from '@/lib/time/time'

/** The last decision on a listing and any overturn of it (design 2026-11-24 §5.2). Older rounds are in the log. */
export function DecisionSummary({ review }: { review: ListingReview }) {
  const { decision, overturn } = review
  if (!decision) return null
  const verb = decision.decision === 'approved' ? 'Approved' : 'Rejected'
  return (
    <div className="flex flex-col gap-2 text-body text-ink">
      <p>
        {verb} by {decision.by} on <span className="tabular-nums">{formatWAT(decision.at)}</span>
        {decision.reasonLabel ? ` for: ${decision.reasonLabel}` : ''}
      </p>
      {decision.sellerMessage && <p className="text-muted">Message to seller: “{decision.sellerMessage}”</p>}
      {decision.note && <p className="text-muted">Internal note: {decision.note}</p>}
      {overturn && (
        <>
          <p>
            Overturned by {overturn.by} on <span className="tabular-nums">{formatWAT(overturn.at)}</span>:{' '}
            {overturn.reasonLabel}
          </p>
          {overturn.sellerMessage && <p className="text-muted">Message to seller: “{overturn.sellerMessage}”</p>}
          {overturn.note && <p className="text-muted">Internal note: {overturn.note}</p>}
        </>
      )}
    </div>
  )
}
