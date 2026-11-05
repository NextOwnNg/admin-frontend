import { KeyValueList } from '@/components/data/KeyValueList'
import { Section } from '@/components/ui/Section'
import { RecordDetailLayout } from '@/features/records/components/RecordDetailLayout'
import { RecordLink } from '@/features/records/components/RecordLink'
import { ListingList, OfferList } from '@/features/records/components/RecordLists'
import type { ItemDetail as ItemDetailData } from '@/lib/api/types/records'
import { AVAILABILITY } from '@/lib/copy/records'
import { formatWAT } from '@/lib/time/time'

const VISIBILITY = { PUBLIC_LISTED: 'Listed publicly', OFFER_ONLY: 'Offered in trades only' } as const

/** One physical item: what its owner declared, where it was listed and offered, and its reservations */
export function ItemDetail({ item }: { item: ItemDetailData }) {
  return (
    <RecordDetailLayout kind="items" id={item.id} title={item.title} detail={item}>
      <Section title="Details">
        <KeyValueList
          items={[
            { term: 'Owner', value: <RecordLink record={item.owner} /> },
            { term: 'Category', value: item.category },
            { term: 'Model', value: item.model ?? 'Not given' },
            { term: 'Condition', value: item.condition },
            { term: 'Defects', value: item.defects ?? 'None declared' },
            { term: 'Repair history', value: item.repairs ?? 'None declared' },
            {
              term: 'Ownership',
              value: item.ownershipDeclared ? 'Owner declared it is theirs to sell' : 'Not declared',
            },
            { term: 'Visibility', value: VISIBILITY[item.visibility] },
            { term: 'Availability', value: AVAILABILITY[item.availability] },
          ]}
        />
      </Section>
      <Section title="Listing history">
        <ListingList rows={item.listings} />
      </Section>
      <Section title="Offers">
        <OfferList rows={item.offers} />
      </Section>
      <Section title="Reservations">
        {item.reservations.length === 0 ? (
          <p className="text-compact text-muted">Never reserved</p>
        ) : (
          <ul className="flex flex-col divide-y divide-border text-compact">
            {item.reservations.map((r) => (
              <li key={`${r.itemId}-${r.reservedAt}`} className="flex flex-col gap-0.5 py-2 first:pt-0 last:pb-0">
                <span className="text-ink tabular-nums">
                  Reserved {formatWAT(r.reservedAt)} · expires {formatWAT(r.expiresAt)}
                </span>
                <span className="text-muted tabular-nums">
                  {r.releasedAt ? `Released ${formatWAT(r.releasedAt)}` : 'Still reserved'}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Section>
    </RecordDetailLayout>
  )
}
