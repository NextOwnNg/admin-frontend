import type { ReactNode } from 'react'
import { DataTable, type Column, type RowAction } from '@/components/data/DataTable'
import { MoneyText } from '@/components/domain/MoneyText'
import { RecordLink } from '@/features/records/components/RecordLink'
import type { ListingReviewRow } from '@/lib/api/types/reviews'
import { REVIEW_COPY } from '@/lib/copy/review'
import { formatWait } from '@/lib/time/time'

/** Waiting listings, oldest first (design 2026-11-24 §5.1) */
export function ReviewQueueTable({
  rows,
  status,
  now,
  onRetry,
  rowActions,
  empty,
}: {
  rows: ListingReviewRow[] | undefined
  status: 'pending' | 'error' | 'forbidden' | 'success'
  now: number
  onRetry: () => void
  rowActions: (row: ListingReviewRow) => RowAction[]
  empty: ReactNode
}) {
  const columns: Column<ListingReviewRow>[] = [
    {
      id: 'title',
      header: 'Listing',
      rowHeader: true,
      cell: (l) => <RecordLink record={{ kind: 'listings', id: l.id, label: l.title }} showId={false} />,
    },
    { id: 'id', header: 'Listing ID', cell: (l) => <span className="tabular-nums">{l.id}</span> },
    { id: 'seller', header: 'Seller', cell: (l) => <RecordLink record={l.seller} showId={false} /> },
    { id: 'category', header: 'Category', cell: (l) => l.category },
    { id: 'area', header: 'Area', cell: (l) => l.area },
    {
      id: 'price',
      header: 'Asking price',
      cell: (l) => (l.askingKobo === null ? 'Swap only' : <MoneyText kobo={l.askingKobo} />),
    },
    {
      id: 'waiting',
      header: 'Waiting',
      cell: (l) => <span className="tabular-nums">{formatWait(l.submittedAt, now)}</span>,
    },
    {
      id: 'notes',
      header: 'Notes',
      cell: (l) => (l.previousRejection ? REVIEW_COPY.queueNote(l.previousRejection.reasonLabel) : null),
    },
  ]
  return (
    <DataTable
      label={REVIEW_COPY.heading}
      tableId="listing-reviews"
      columns={columns}
      rows={rows}
      rowKey={(row) => row.id}
      status={status}
      onRetry={onRetry}
      rowActions={rowActions}
      empty={empty}
    />
  )
}
