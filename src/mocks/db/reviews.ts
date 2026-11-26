import type { ListingDetail, RecordPage } from '@/lib/api/types/records'
import type { ListingReviewRow, OverturnBody, ReviewBody, ReviewDecision } from '@/lib/api/types/reviews'
import type { ReasonKind } from '@/lib/api/types/reference'
import { REVIEW_COPY, SELLER_MESSAGE_MAX } from '@/lib/copy/review'
import { auditDb, page } from '@/mocks/db/audit'
import { listingRow, recordsDb } from '@/mocks/db/records'
import { overturnBlockedReason } from '@/mocks/db/review-state'
import { store } from '@/mocks/db/store'
import { REASON_CODES } from '@/mocks/fixtures/reason-codes'
import type { ListingRec } from '@/mocks/records-seed'

/** Listing review (design 2026-11-24 §6, §7): the queue, decisions and overturns. */

type Actor = { staffId: string; displayName: string }
export type ReviewOutcome =
  { ok: ListingDetail } | { failure: 'not_found' | 'conflict' } | { invalid: Record<string, string> }

const listings = () => store().records.listings
const find = (id: string) => listings().find((l) => l.id === id)
const isWaiting = (l: ListingRec) => l.status === 'PENDING_REVIEW' && l.submittedAt !== null

const reason = (code: string | undefined, kind: ReasonKind) =>
  REASON_CODES.find((c) => c.code === code && c.kind === kind && c.appliesTo.includes('listing'))

/** The form rules, as the server checks them */
function checkFields(body: { reasonCode?: string; sellerMessage?: string }, kind: ReasonKind | null) {
  const fields: Record<string, string> = {}
  const message = (body.sellerMessage ?? '').trim()
  if (kind && !reason(body.reasonCode, kind)) fields.reasonCode = REVIEW_COPY.reasonRequired
  if (message.length > SELLER_MESSAGE_MAX) fields.sellerMessage = REVIEW_COPY.messageTooLong
  else if (body.reasonCode === 'REJECT_OTHER' && !message) fields.sellerMessage = REVIEW_COPY.messageRequired
  return { fields, message: message || null }
}

function setStatus(l: ListingRec, status: ListingRec['status'], at: string) {
  l.status = status
  l.publishedAt = status === 'ACTIVE' ? at : null
  l.statusHistory.push({ status, at })
  l.version += 1
}

function log(
  l: ListingRec,
  actor: Actor,
  action: string,
  reasonCode: string | null,
  note: string | null,
  key: string | null,
) {
  auditDb.append({
    entry: {
      actor: actor.displayName,
      action,
      target: { type: 'listing', id: l.id, label: l.title },
      reasonCode,
      note,
      before: null,
      after: { status: l.status },
      caseId: null,
      transactionId: null,
    },
    actorId: actor.staffId,
    caseId: null,
    transactionId: null,
    idempotencyKey: key,
  })
}

const detail = (l: ListingRec): ReviewOutcome => ({ ok: recordsDb.detail('listings', l.id)! })

export const reviewsDb = {
  list(params: URLSearchParams): RecordPage<ListingReviewRow> {
    const category = params.get('category')
    const area = params.get('area')
    const rows = listings()
      .filter(isWaiting)
      .filter((l) => (!category || l.category === category) && (!area || l.area === area))
      .sort((a, b) => a.submittedAt!.localeCompare(b.submittedAt!))
      .map((l) => ({
        ...listingRow(l),
        submittedAt: l.submittedAt!,
        previousRejection: l.review?.previousRejection ?? null,
      }))
    return structuredClone(page(rows, params.get('cursor') ?? undefined))
  },

  waiting() {
    const waiting = listings()
      .filter(isWaiting)
      .map((l) => l.submittedAt!)
      .sort()
    return { waiting: waiting.length, oldestSubmittedAt: waiting[0] ?? null }
  },

  decide(id: string, body: ReviewBody, actor: Actor, key: string | null): ReviewOutcome {
    const l = find(id)
    if (!l) return { failure: 'not_found' }
    const rejecting = body.decision === 'reject'
    const { fields, message } = checkFields(body, rejecting ? 'rejection' : null)
    if (Object.keys(fields).length > 0) return { invalid: fields }
    if (!isWaiting(l) || body.expectedVersion !== l.version) return { failure: 'conflict' }

    const at = new Date().toISOString()
    const code = rejecting ? body.reasonCode! : null
    const decision: ReviewDecision = {
      decision: rejecting ? 'rejected' : 'approved',
      by: actor.displayName,
      at,
      reasonCode: code,
      reasonLabel: code ? reason(code, 'rejection')!.label : null,
      sellerMessage: rejecting ? message : null,
      note: body.note?.trim() || null,
    }
    l.review = {
      previousRejection: l.review?.previousRejection ?? null,
      decision,
      overturn: null,
      changedSince: false,
    }
    setStatus(l, rejecting ? 'DRAFT' : 'ACTIVE', at)
    log(l, actor, rejecting ? 'reject_listing' : 'approve_listing', code, decision.note, key)
    return detail(l)
  },

  overturn(id: string, body: OverturnBody, actor: Actor, key: string | null): ReviewOutcome {
    const l = find(id)
    if (!l) return { failure: 'not_found' }
    const decided = l.review?.decision
    if (!decided) return { failure: 'conflict' }
    const approving = decided.decision === 'rejected'
    // Overturning an approval rejects it; overturning a rejection needs a decision code
    const { fields, message } = checkFields(body, approving ? 'decision' : 'rejection')
    if (Object.keys(fields).length > 0) return { invalid: fields }
    if (overturnBlockedReason(l) !== null || body.expectedVersion !== l.version) return { failure: 'conflict' }

    const at = new Date().toISOString()
    l.review!.overturn = {
      by: actor.displayName,
      at,
      reasonCode: body.reasonCode,
      reasonLabel: reason(body.reasonCode, approving ? 'decision' : 'rejection')!.label,
      sellerMessage: message,
      note: body.note?.trim() || null,
    }
    if (!approving) {
      // Taken down: offers still waiting for an answer end (design 2026-11-24 §6.3)
      for (const o of store().records.offers) if (o.listingId === l.id && o.status === 'PENDING') o.status = 'EXPIRED'
    }
    setStatus(l, approving ? 'ACTIVE' : 'DRAFT', at)
    log(l, actor, 'overturn_review', body.reasonCode, l.review!.overturn.note, key)
    return detail(l)
  },

  /** Tests and demos: the seller edits a rejected draft and resubmits it */
  resubmit(id: string) {
    const l = find(id)
    const decision = l?.review?.decision
    if (!l || !decision || decision.decision !== 'rejected') return
    const at = new Date().toISOString()
    l.review = {
      previousRejection: {
        at: decision.at,
        reasonCode: decision.reasonCode!,
        reasonLabel: decision.reasonLabel!,
        sellerMessage: decision.sellerMessage,
      },
      decision: null,
      overturn: null,
      changedSince: true,
    }
    l.submittedAt = at
    l.status = 'PENDING_REVIEW'
    l.statusHistory.push({ status: 'PENDING_REVIEW', at })
    l.version += 1
  },
}
