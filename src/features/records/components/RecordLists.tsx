import type { ReactNode } from 'react'
import { MoneyText } from '@/components/domain/MoneyText'
import { TransactionStatusBadge } from '@/components/domain/TransactionStatusBadge'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { ReasonText } from '@/features/records/components/ReasonText'
import { RecordLink } from '@/features/records/components/RecordLink'
import type { ItemRow, ListingRow, OfferRow, ReportRow, TransactionRow } from '@/lib/api/types/records'
import { AVAILABILITY, LISTING_STATUS, OFFER_STATUS } from '@/lib/copy/records'

/** Short lists of related records inside a record page, each linked to its own page */
function RecordList<T extends { id: string }>({
  rows,
  empty,
  render,
}: {
  rows: T[]
  empty: string
  render: (row: T) => ReactNode
}) {
  if (rows.length === 0) return <p className="text-compact text-muted">{empty}</p>
  return (
    <ul className="flex flex-col divide-y divide-border text-compact">
      {rows.map((row) => (
        <li key={row.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2 first:pt-0 last:pb-0">
          {render(row)}
        </li>
      ))}
    </ul>
  )
}

const Meta = ({ children }: { children: ReactNode }) => <span className="text-muted">{children}</span>

export const ItemList = ({ rows }: { rows: ItemRow[] }) => (
  <RecordList
    rows={rows}
    empty="No items yet"
    render={(i) => (
      <>
        <RecordLink record={{ kind: 'items', id: i.id, label: i.title }} />
        <Meta>
          {i.category} · {AVAILABILITY[i.availability]}
        </Meta>
      </>
    )}
  />
)

export const ListingList = ({ rows }: { rows: ListingRow[] }) => (
  <RecordList
    rows={rows}
    empty="No listings yet"
    render={(l) => (
      <>
        <RecordLink record={{ kind: 'listings', id: l.id, label: l.title }} />
        <StatusBadge {...LISTING_STATUS[l.status]} />
        <Meta>{l.askingKobo === null ? 'Swap only' : <MoneyText kobo={l.askingKobo} />}</Meta>
      </>
    )}
  />
)

export const OfferList = ({ rows }: { rows: OfferRow[] }) => (
  <RecordList
    rows={rows}
    empty="No offers yet"
    render={(o) => (
      <>
        <RecordLink record={{ kind: 'offers', id: o.id, label: `Offer on ${o.listing.label}` }} />
        <StatusBadge {...OFFER_STATUS[o.status]} />
        <Meta>
          {o.initiator.label} → {o.recipient.label}
        </Meta>
      </>
    )}
  />
)

export const TransactionList = ({ rows }: { rows: TransactionRow[] }) => (
  <RecordList
    rows={rows}
    empty="No transactions yet"
    render={(t) => (
      <>
        <RecordLink record={{ kind: 'transactions', id: t.id, label: t.id }} />
        <TransactionStatusBadge status={t.status} />
        <Meta>
          {t.participants[0].label} and {t.participants[1].label}
        </Meta>
      </>
    )}
  />
)

export const ReportList = ({ rows, empty }: { rows: ReportRow[]; empty: string }) => (
  <RecordList
    rows={rows}
    empty={empty}
    render={(r) => (
      <>
        <RecordLink record={{ kind: 'reports', id: r.id, label: r.id }} />
        <Meta>
          <ReasonText code={r.reasonCode} /> · about {r.target.label}
        </Meta>
        <RecordLink record={{ ...r.case, label: r.case.id }} />
      </>
    )}
  />
)
