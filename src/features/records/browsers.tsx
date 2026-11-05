import { z } from 'zod'
import type { Column } from '@/components/data/DataTable'
import type { FilterOption } from '@/components/data/filter-utils'
import { MoneyText } from '@/components/domain/MoneyText'
import { TransactionStatusBadge } from '@/components/domain/TransactionStatusBadge'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { RecordLink } from '@/features/records/components/RecordLink'
import { commaList, CURSOR } from '@/hooks/useUrlFilters'
import { useReasonCodes } from '@/lib/api/reference'
import { ReasonText } from '@/features/records/components/ReasonText'
import type { RecordKind, RecordRowFor } from '@/lib/api/types/records'
import { TARGET_TYPE_LABELS } from '@/lib/copy/labels'
import {
  AVAILABILITY,
  FEED_STATUS,
  LISTING_MODE,
  LISTING_STATUS,
  memberStatusText,
  OFFER_STATUS,
  PILOT_AREAS,
  PILOT_CATEGORIES,
} from '@/lib/copy/records'
import { REDACTION, TRANSACTION_FLAG, TRANSACTION_STATUS } from '@/lib/copy/status'
import { cashDirection } from '@/lib/money/money'
import { formatWAT, formatWATDate } from '@/lib/time/time'

/**
 * The seven record browsers as configuration (Phase C design §4.1): columns, filters and their URL schema.
 * Lists show only what identifies a record (PRD §7).
 */

export type FilterSpec = {
  key: string
  label: string
  multiple: boolean
  /** Static choices, or a hook for choices the API serves (call order is fixed per browser) */
  options: FilterOption[] | (() => FilterOption[])
  /** URL values accepted when the choices aren't known in advance */
  pattern?: RegExp
}

export type BrowserConfig<K extends RecordKind> = {
  kind: K
  title: string
  /** "members", for "Search members by ID or name" and empty states */
  noun: string
  columns: Column<RecordRowFor[K]>[]
  filters: FilterSpec[]
}

const options = <T extends string>(labels: Record<T, string | { label: string }>): FilterOption[] =>
  Object.entries<string | { label: string }>(labels).map(([value, label]) => ({
    value,
    label: typeof label === 'string' ? label : label.label,
  }))
const plain = (values: readonly string[]): FilterOption[] => values.map((v) => ({ value: v, label: v }))
const id = (value: string) => <span className="whitespace-nowrap tabular-nums">{value}</span>
const when = (iso: string) => <span className="tabular-nums">{formatWATDate(iso)}</span>

function useReasonOptions(): FilterOption[] {
  const reasons = useReasonCodes()
  return (reasons.data ?? []).map((r) => ({ value: r.code, label: r.label }))
}

const TYPE_OPTIONS = options(TARGET_TYPE_LABELS).filter((o) => o.value !== 'case')

export const BROWSERS: { [K in RecordKind]: BrowserConfig<K> } = {
  users: {
    kind: 'users',
    title: 'Members',
    noun: 'members',
    columns: [
      {
        id: 'name',
        header: 'Name',
        cell: (m) => <RecordLink record={{ kind: 'users', id: m.id, label: m.displayName }} showId={false} />,
      },
      { id: 'id', header: 'Member ID', cell: (m) => id(m.id) },
      { id: 'area', header: 'Area', cell: (m) => m.area },
      { id: 'joined', header: 'Joined', cell: (m) => when(m.joinedAt) },
      { id: 'status', header: 'Status', cell: (m) => memberStatusText(m.status, m.restrictedUntil) },
      { id: 'cases', header: 'Open cases', cell: (m) => id(String(m.openCases)) },
    ],
    filters: [
      {
        key: 'status',
        label: 'Status',
        multiple: true,
        options: options({ active: 'Active', restricted: 'Restricted' }),
      },
      { key: 'area', label: 'Area', multiple: false, options: plain(PILOT_AREAS) },
    ],
  },
  items: {
    kind: 'items',
    title: 'Items',
    noun: 'items',
    columns: [
      {
        id: 'title',
        header: 'Item',
        cell: (i) => <RecordLink record={{ kind: 'items', id: i.id, label: i.title }} showId={false} />,
      },
      { id: 'id', header: 'Item ID', cell: (i) => id(i.id) },
      { id: 'owner', header: 'Owner', cell: (i) => <RecordLink record={i.owner} showId={false} /> },
      { id: 'category', header: 'Category', cell: (i) => i.category },
      { id: 'availability', header: 'Availability', cell: (i) => AVAILABILITY[i.availability] },
    ],
    filters: [
      { key: 'category', label: 'Category', multiple: false, options: plain(PILOT_CATEGORIES) },
      { key: 'availability', label: 'Availability', multiple: true, options: options(AVAILABILITY) },
    ],
  },
  listings: {
    kind: 'listings',
    title: 'Listings',
    noun: 'listings',
    columns: [
      {
        id: 'title',
        header: 'Listing',
        cell: (l) => <RecordLink record={{ kind: 'listings', id: l.id, label: l.title }} showId={false} />,
      },
      { id: 'id', header: 'Listing ID', cell: (l) => id(l.id) },
      { id: 'seller', header: 'Seller', cell: (l) => <RecordLink record={l.seller} showId={false} /> },
      {
        id: 'price',
        header: 'Asking price',
        cell: (l) => (l.askingKobo === null ? 'Swap only' : <MoneyText kobo={l.askingKobo} />),
      },
      { id: 'modes', header: 'Modes', cell: (l) => l.modes.map((m) => LISTING_MODE[m]).join(', ') },
      {
        id: 'status',
        header: 'Status',
        cell: (l) => <StatusBadge {...LISTING_STATUS[l.status]} />,
      },
      {
        id: 'urgent',
        header: 'Quick Sell',
        cell: (l) => (l.urgentUntil ? <span className="tabular-nums">Until {formatWAT(l.urgentUntil)}</span> : null),
      },
      {
        id: 'moderation',
        header: 'Moderation',
        cell: (l) =>
          l.moderation === 'hidden'
            ? REDACTION.hidden_by_moderation
            : l.moderation === 'removed'
              ? 'Removed by moderation'
              : null,
      },
    ],
    filters: [
      { key: 'status', label: 'Status', multiple: true, options: options(LISTING_STATUS) },
      { key: 'category', label: 'Category', multiple: false, options: plain(PILOT_CATEGORIES) },
      { key: 'area', label: 'Area', multiple: false, options: plain(PILOT_AREAS) },
      { key: 'mode', label: 'Mode', multiple: true, options: options(LISTING_MODE) },
      { key: 'urgent', label: 'Quick Sell', multiple: false, options: [{ value: '1', label: 'Quick Sell only' }] },
    ],
  },
  offers: {
    kind: 'offers',
    title: 'Offers',
    noun: 'offers',
    columns: [
      {
        id: 'id',
        header: 'Offer',
        cell: (o) => <RecordLink record={{ kind: 'offers', id: o.id, label: o.id }} showId={false} />,
      },
      { id: 'listing', header: 'Listing', cell: (o) => <RecordLink record={o.listing} showId={false} /> },
      {
        id: 'people',
        header: 'From → to',
        cell: (o) => (
          <span>
            <RecordLink record={o.initiator} showId={false} /> → <RecordLink record={o.recipient} showId={false} />
          </span>
        ),
      },
      {
        id: 'version',
        header: 'Current version',
        cell: (o) => (
          <span className="flex flex-col gap-0.5">
            <span className="tabular-nums">
              Version {o.current.number} · {cashDirection(o.current.cashDirection, o.current.cashKobo)}
            </span>
            {o.current.offeredItem && (
              <span>
                Plus <RecordLink record={o.current.offeredItem} showId={false} />
              </span>
            )}
          </span>
        ),
      },
      { id: 'status', header: 'Status', cell: (o) => <StatusBadge {...OFFER_STATUS[o.status]} /> },
      {
        id: 'expires',
        header: 'Expires',
        cell: (o) => (o.expiresAt ? <span className="tabular-nums">{formatWAT(o.expiresAt)}</span> : null),
      },
    ],
    filters: [{ key: 'status', label: 'Status', multiple: true, options: options(OFFER_STATUS) }],
  },
  transactions: {
    kind: 'transactions',
    title: 'Transactions',
    noun: 'transactions',
    columns: [
      {
        id: 'id',
        header: 'Transaction',
        cell: (t) => <RecordLink record={{ kind: 'transactions', id: t.id, label: t.id }} showId={false} />,
      },
      {
        id: 'participants',
        header: 'Participants',
        cell: (t) => (
          <span>
            <RecordLink record={t.participants[0]} showId={false} /> and{' '}
            <RecordLink record={t.participants[1]} showId={false} />
          </span>
        ),
      },
      { id: 'status', header: 'Status', cell: (t) => <TransactionStatusBadge status={t.status} /> },
      {
        id: 'flag',
        header: 'Exception',
        cell: (t) => (
          <span className="flex flex-wrap gap-1">
            {t.flags.map((f) => (
              <StatusBadge key={f} {...TRANSACTION_FLAG[f]} />
            ))}
          </span>
        ),
      },
      { id: 'created', header: 'Created', cell: (t) => when(t.createdAt) },
    ],
    filters: [
      { key: 'status', label: 'Status', multiple: true, options: options(TRANSACTION_STATUS) },
      { key: 'flag', label: 'Exception', multiple: true, options: options(TRANSACTION_FLAG) },
    ],
  },
  feed: {
    kind: 'feed',
    title: 'Feed',
    noun: 'feed posts',
    columns: [
      {
        id: 'id',
        header: 'Post',
        cell: (f) => <RecordLink record={{ kind: 'feed', id: f.id, label: f.id }} showId={false} />,
      },
      { id: 'author', header: 'Author', cell: (f) => <RecordLink record={f.author} showId={false} /> },
      { id: 'listing', header: 'Listing', cell: (f) => <RecordLink record={f.listing} showId={false} /> },
      {
        id: 'caption',
        header: 'Caption',
        cell: (f) => (f.redaction ? <span className="text-muted italic">{REDACTION[f.redaction]}</span> : f.caption),
      },
      { id: 'status', header: 'Status', cell: (f) => <StatusBadge {...FEED_STATUS[f.status]} /> },
      { id: 'created', header: 'Created', cell: (f) => when(f.createdAt) },
    ],
    filters: [{ key: 'status', label: 'Status', multiple: true, options: options(FEED_STATUS) }],
  },
  reports: {
    kind: 'reports',
    title: 'Reports',
    noun: 'reports',
    columns: [
      {
        id: 'id',
        header: 'Report',
        cell: (r) => <RecordLink record={{ kind: 'reports', id: r.id, label: r.id }} showId={false} />,
      },
      {
        id: 'target',
        header: 'Reported',
        cell: (r) => (
          <span className="flex flex-col gap-0.5">
            <span className="text-caption text-muted">{TARGET_TYPE_LABELS[r.targetType]}</span>
            <RecordLink record={r.target} showId={false} />
          </span>
        ),
      },
      { id: 'reporter', header: 'Reporter', cell: (r) => <RecordLink record={r.reporter} showId={false} /> },
      { id: 'reason', header: 'Reason', cell: (r) => <ReasonText code={r.reasonCode} /> },
      {
        id: 'case',
        header: 'Case',
        cell: (r) => <RecordLink record={{ ...r.case, label: r.case.id }} showId={false} />,
      },
      { id: 'received', header: 'Received', cell: (r) => when(r.receivedAt) },
    ],
    filters: [
      { key: 'type', label: 'Type', multiple: true, options: TYPE_OPTIONS },
      { key: 'reason', label: 'Reason', multiple: false, options: useReasonOptions, pattern: /^[A-Z][A-Z_]{1,39}$/ },
    ],
  },
}

const SEARCH = z.string().trim().min(1).max(80)

/** The browser's URL parameters: its filters, the search text and the cursor. Unknown values are dropped. */
export function browserSchema(config: BrowserConfig<RecordKind>) {
  const shape: Record<string, z.ZodType> = { q: SEARCH.optional(), cursor: CURSOR.optional() }
  for (const spec of config.filters) {
    if (typeof spec.options === 'function') {
      shape[spec.key] = z
        .string()
        .regex(spec.pattern ?? /^[\w-]{1,40}$/)
        .optional()
      continue
    }
    const values = spec.options.map((o) => o.value) as [string, ...string[]]
    shape[spec.key] = spec.multiple ? commaList(values).optional() : z.enum(values).optional()
  }
  return z.object(shape)
}

export const BROWSER_SCHEMAS = Object.fromEntries(
  Object.values(BROWSERS).map((config) => [config.kind, browserSchema(config as BrowserConfig<RecordKind>)]),
) as Record<RecordKind, ReturnType<typeof browserSchema>>
