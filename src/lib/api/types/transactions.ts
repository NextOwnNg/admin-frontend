import type { AuditEntry } from '@/lib/api/types/audit'
import type { RecordLinkGroup } from '@/lib/api/types/records'
import type { CashDirection } from '@/lib/money/money'
import type { TransactionFlag, TransactionOutcome, TransactionStatus } from '@/lib/copy/status'

/** Transactions as the console reads them (design §4.4). Read-only: no endpoint creates a confirmation (ADM-T-01). */

export type { TransactionOutcome }

export type OfferItem = { id: string; title: string; condition: string; defects: string | null }
export type OfferSide = { participant: 'A' | 'B'; displayName: string; items: OfferItem[] }
export type OfferTerms = { gives: OfferSide; receives: OfferSide; cashKobo: number; cashDirection: CashDirection }

export type OfferVersion = {
  number: number
  proposedBy: string
  at: string
  terms: OfferTerms
  /** `pending`: the latest version of an offer still waiting for a reply */
  state: 'pending' | 'accepted' | 'superseded' | 'expired' | 'rejected' | 'withdrawn'
}

/** A participant's own confirmation, as they reported it */
export type Confirmation = {
  participant: 'A' | 'B'
  displayName: string
  confirmedAt: string | null
  inspectedItems: boolean | null
  cashHandled: boolean | null
}

export type Reservation = {
  itemId: string
  itemTitle: string
  reservedAt: string
  expiresAt: string
  releasedAt: string | null
  releaseReason: string | null
  /** The API allows an administrator to release it now */
  releasable: boolean
}

export type TransactionSummary = {
  id: string
  status: TransactionStatus
  flags: TransactionFlag[]
  confirmations: 0 | 1 | 2
  terms: OfferTerms
}

export type TransactionDetail = TransactionSummary & {
  acceptedAt: string
  /** The agreement frozen at acceptance */
  snapshot: OfferTerms
  versions: OfferVersion[]
  confirmationEvents: Confirmation[]
  reservations: Reservation[]
  caseIds: string[]
  /** The API's authority on how this transaction may be resolved; `completed` needs two valid confirmations */
  allowedOutcomes: TransactionOutcome[]
  history: AuditEntry[]
  version: number
  /** The participants, items and offer as records; only for staff who may browse records (Phase C) */
  links?: RecordLinkGroup[]
}

/** `POST /admin/transactions/:id/resolution` */
export type ResolutionBody = { outcome: TransactionOutcome; reasonCode: string; note?: string; expectedVersion: number }
/** `POST /admin/transactions/:id/release` */
export type ReleaseBody = { itemId: string; reasonCode: string; note?: string; expectedVersion: number }
export type TransactionActionResult = { transaction: TransactionDetail; auditEntry: AuditEntry }
