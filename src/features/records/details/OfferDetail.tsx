import { OfferSummary } from '@/components/domain/OfferSummary'
import { VersionTimeline } from '@/components/domain/VersionTimeline'
import { KeyValueList } from '@/components/data/KeyValueList'
import { Section } from '@/components/ui/Section'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { RecordDetailLayout } from '@/features/records/components/RecordDetailLayout'
import { RecordLink } from '@/features/records/components/RecordLink'
import type { OfferDetail as OfferDetailData } from '@/lib/api/types/records'
import { OFFER_STATUS } from '@/lib/copy/records'
import { formatWAT } from '@/lib/time/time'

const itemHref = (id: string) => `/records/items/${id}`

/** An offer and every version of it, exactly as proposed. Read-only: versions are immutable (PRD §6). */
export function OfferDetail({ offer }: { offer: OfferDetailData }) {
  const latest = offer.versions[0]
  return (
    <RecordDetailLayout
      kind="offers"
      id={offer.id}
      title={`Offer on ${offer.listing.label}`}
      detail={offer}
      badge={<StatusBadge {...OFFER_STATUS[offer.status]} />}
    >
      <Section title="Current terms">
        <KeyValueList
          items={[
            { term: 'From', value: <RecordLink record={offer.initiator} /> },
            { term: 'To', value: <RecordLink record={offer.recipient} /> },
            { term: 'Listing', value: <RecordLink record={offer.listing} /> },
            ...(offer.expiresAt
              ? [{ term: 'Expires', value: <span className="tabular-nums">{formatWAT(offer.expiresAt)}</span> }]
              : []),
            ...(offer.transaction ? [{ term: 'Transaction', value: <RecordLink record={offer.transaction} /> }] : []),
          ]}
        />
        {latest && <OfferSummary terms={latest.terms} itemHref={itemHref} />}
      </Section>
      <Section title="Versions">
        <VersionTimeline versions={offer.versions} />
      </Section>
    </RecordDetailLayout>
  )
}
