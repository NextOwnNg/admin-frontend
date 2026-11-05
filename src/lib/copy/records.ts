import {
  Ban,
  CircleCheck,
  CircleDot,
  Clock,
  EyeOff,
  FilePen,
  Hourglass,
  Lock,
  ShieldAlert,
  Undo2,
  type LucideIcon,
} from 'lucide-react'
import type { StatusTone } from '@/components/ui/StatusBadge'
import type {
  Availability,
  FeedStatus,
  ListingMode,
  ListingStatus,
  OfferStatus,
  RecordKind,
  RecordRef,
} from '@/lib/api/types/records'
import { formatWATDate } from '@/lib/time/time'

/** Record labels (Phase C design §4.1). Listing states follow parent PRD LST-05. */

type Label = { label: string; icon: LucideIcon; tone: StatusTone }

export const LISTING_STATUS: Record<ListingStatus, Label> = {
  DRAFT: { label: 'Draft', icon: FilePen, tone: 'neutral' },
  PENDING_REVIEW: { label: 'Pending review', icon: Hourglass, tone: 'info' },
  ACTIVE: { label: 'Active', icon: CircleDot, tone: 'success' },
  RESERVED: { label: 'Reserved', icon: Lock, tone: 'info' },
  EXPIRED: { label: 'Expired', icon: Clock, tone: 'neutral' },
  COMPLETED: { label: 'Completed', icon: CircleCheck, tone: 'success' },
  CLOSED: { label: 'Closed', icon: Ban, tone: 'neutral' },
  REMOVED: { label: 'Removed', icon: ShieldAlert, tone: 'danger' },
}
export const LISTING_STATUSES = Object.keys(LISTING_STATUS) as [ListingStatus, ...ListingStatus[]]

export const LISTING_MODE: Record<ListingMode, string> = {
  CASH: 'Cash',
  SWAP: 'Swap',
  SWAP_PLUS_CASH: 'Swap plus cash',
}
export const LISTING_MODES = Object.keys(LISTING_MODE) as [ListingMode, ...ListingMode[]]

export const OFFER_STATUS: Record<OfferStatus, Label> = {
  PENDING: { label: 'Pending', icon: Hourglass, tone: 'info' },
  ACCEPTED: { label: 'Accepted', icon: CircleCheck, tone: 'success' },
  REJECTED: { label: 'Rejected', icon: Ban, tone: 'neutral' },
  EXPIRED: { label: 'Expired', icon: Clock, tone: 'neutral' },
  WITHDRAWN: { label: 'Withdrawn', icon: Undo2, tone: 'neutral' },
}
export const OFFER_STATUSES = Object.keys(OFFER_STATUS) as [OfferStatus, ...OfferStatus[]]

export const AVAILABILITY: Record<Availability, string> = {
  available: 'Available',
  reserved: 'Reserved',
  closed: 'Closed',
}
export const AVAILABILITIES = Object.keys(AVAILABILITY) as [Availability, ...Availability[]]

export const FEED_STATUS: Record<FeedStatus, Label> = {
  visible: { label: 'Visible', icon: CircleDot, tone: 'success' },
  hidden: { label: 'Hidden by moderation', icon: EyeOff, tone: 'warning' },
  removed: { label: 'Removed', icon: Ban, tone: 'neutral' },
}
export const FEED_STATUSES = Object.keys(FEED_STATUS) as [FeedStatus, ...FeedStatus[]]

/** `"Active"` or `"Restricted until 10 Nov 2026"` */
export function memberStatusText(status: 'active' | 'restricted', restrictedUntil: string | null): string {
  if (status === 'active') return 'Active'
  return restrictedUntil ? `Restricted until ${formatWATDate(restrictedUntil)}` : 'Restricted'
}

export const RECORD_KIND_LABEL: Record<RecordKind | 'cases', string> = {
  users: 'Members',
  items: 'Items',
  listings: 'Listings',
  offers: 'Offers',
  transactions: 'Transactions',
  feed: 'Feed',
  reports: 'Reports',
  cases: 'Cases',
}

/** One record of a kind, for headings: "Member", "Feed post" */
export const RECORD_KIND_SINGULAR: Record<RecordKind | 'cases', string> = {
  users: 'Member',
  items: 'Item',
  listings: 'Listing',
  offers: 'Offer',
  transactions: 'Transaction',
  feed: 'Feed post',
  reports: 'Report',
  cases: 'Case',
}

/** Where a record lives in the console: cases and transactions have their own pages */
export function recordHref(ref: Pick<RecordRef, 'kind' | 'id'>): string {
  if (ref.kind === 'cases') return `/cases/${ref.id}`
  if (ref.kind === 'transactions') return `/transactions/${ref.id}`
  return `/records/${ref.kind}/${ref.id}`
}

/** Pilot areas and categories until the settings API serves them (Phase C2). DRAFT. */
export const PILOT_AREAS = ['Ajah', 'Ikeja', 'Lekki', 'Surulere', 'Yaba'] as const
export const PILOT_CATEGORIES = ['Bikes', 'Electronics', 'Fashion', 'Gaming', 'Home', 'Laptops', 'Phones'] as const
