import type { AuditEntry } from '@/lib/api/types/audit'
import type { CaseSummary, Redaction } from '@/lib/api/types/cases'
import type { TargetType } from '@/lib/api/types/reference'
import type { OfferVersion, Reservation } from '@/lib/api/types/transactions'
import type { TransactionFlag, TransactionStatus } from '@/lib/copy/status'
import type { CashDirection } from '@/lib/money/money'

/**
 * Record browsers (Phase C design §4.1, §4.2, §5). Lists carry only what identifies a record (PRD §7):
 * never a phone number or private message text. Hand-written until the OpenAPI spec lands.
 */

export type RecordKind = 'users' | 'items' | 'listings' | 'offers' | 'transactions' | 'feed' | 'reports'

/** A link to another record; `label` is a name or title, never private data */
export type RecordRef = { kind: RecordKind | 'cases'; id: string; label: string }

/** The record's neighbours along the chain, grouped and ordered up the chain then down */
export type RecordLinkGroup = { label: string; records: RecordRef[] }

export type RecordCase = Pick<CaseSummary, 'id' | 'severity' | 'status' | 'summary' | 'redaction'>

export type ListingStatus =
  'DRAFT' | 'PENDING_REVIEW' | 'ACTIVE' | 'RESERVED' | 'EXPIRED' | 'COMPLETED' | 'CLOSED' | 'REMOVED'
export type ListingMode = 'CASH' | 'SWAP' | 'SWAP_PLUS_CASH'
export type OfferStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED' | 'WITHDRAWN'
export type MemberStatus = 'active' | 'restricted'
export type Availability = 'available' | 'reserved' | 'closed'
export type ModerationState = 'clear' | 'hidden' | 'removed'
export type FeedStatus = 'visible' | 'hidden' | 'removed'

export type MemberRow = {
  id: string
  displayName: string
  area: string
  joinedAt: string
  status: MemberStatus
  restrictedUntil: string | null
  openCases: number
}

export type ItemRow = { id: string; title: string; owner: RecordRef; category: string; availability: Availability }

export type ListingRow = {
  id: string
  title: string
  seller: RecordRef
  /** Null for swap-only listings */
  askingKobo: number | null
  modes: ListingMode[]
  status: ListingStatus
  /** Quick Sell deadline (UTC) */
  urgentUntil: string | null
  moderation: ModerationState
  category: string
  area: string
}

export type OfferRow = {
  id: string
  listing: RecordRef
  initiator: RecordRef
  recipient: RecordRef
  current: { number: number; cashKobo: number; cashDirection: CashDirection; offeredItem: RecordRef | null }
  status: OfferStatus
  expiresAt: string | null
}

export type TransactionRow = {
  id: string
  participants: [RecordRef, RecordRef]
  status: TransactionStatus
  flags: TransactionFlag[]
  createdAt: string
}

export type FeedRow = {
  id: string
  author: RecordRef
  listing: RecordRef
  /** Null when redacted */
  caption: string | null
  redaction: Redaction
  status: FeedStatus
  createdAt: string
}

export type ReportRow = {
  id: string
  targetType: TargetType
  target: RecordRef
  reporter: RecordRef
  reasonCode: string
  case: RecordRef
  receivedAt: string
}

export type RecordPage<T> = { items: T[]; nextCursor: string | null; total: number }

export type DetailBase = { links: RecordLinkGroup[]; cases: RecordCase[] }

export type MemberDetail = MemberRow &
  DetailBase & {
    hasPhone: boolean
    items: ItemRow[]
    listings: ListingRow[]
    offers: OfferRow[]
    transactions: TransactionRow[]
    reportsFiled: ReportRow[]
    reportsReceived: ReportRow[]
    history: AuditEntry[]
  }

export type ItemDetail = ItemRow &
  DetailBase & {
    model: string | null
    condition: string
    defects: string | null
    repairs: string | null
    ownershipDeclared: boolean
    visibility: 'PUBLIC_LISTED' | 'OFFER_ONLY'
    listings: ListingRow[]
    offers: OfferRow[]
    reservations: Reservation[]
  }

export type ListingDetail = ListingRow &
  DetailBase & {
    item: RecordRef
    desiredItems: string | null
    /** Null when redacted */
    description: string | null
    redaction: Redaction
    publishedAt: string | null
    statusHistory: { status: ListingStatus; at: string }[]
    offers: OfferRow[]
    feedPosts: FeedRow[]
    reports: ReportRow[]
  }

export type OfferDetail = OfferRow & DetailBase & { versions: OfferVersion[]; transaction: RecordRef | null }

export type FeedComment = { id: string; author: RecordRef; text: string | null; redaction: Redaction; at: string }
export type FeedDetail = FeedRow & DetailBase & { comments: FeedComment[]; reports: ReportRow[] }

export type ReportDetail = ReportRow & DetailBase & { description: string; evidenceCount: number }

export type RecordRowFor = {
  users: MemberRow
  items: ItemRow
  listings: ListingRow
  offers: OfferRow
  transactions: TransactionRow
  feed: FeedRow
  reports: ReportRow
}
export type DetailKind = Exclude<RecordKind, 'transactions'>
export type RecordDetailFor = {
  users: MemberDetail
  items: ItemDetail
  listings: ListingDetail
  offers: OfferDetail
  feed: FeedDetail
  reports: ReportDetail
}

/** `POST /admin/records/users/:id/reveal` */
export type MemberRevealBody = { field: 'phone'; reason: string }
