import { EyeOff, ShieldAlert } from 'lucide-react'
import { KeyValueList } from '@/components/data/KeyValueList'
import { Timeline } from '@/components/data/Timeline'
import { MoneyText } from '@/components/domain/MoneyText'
import { Section } from '@/components/ui/Section'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { RecordDetailLayout } from '@/features/records/components/RecordDetailLayout'
import { RecordLink } from '@/features/records/components/RecordLink'
import { OfferList, ReportList } from '@/features/records/components/RecordLists'
import type { ListingDetail as ListingDetailData } from '@/lib/api/types/records'
import { FEED_STATUS, LISTING_MODE, LISTING_STATUS } from '@/lib/copy/records'
import { REDACTION } from '@/lib/copy/status'
import { formatWAT } from '@/lib/time/time'

/** Moderated content shows its label, never its text, whichever field the API sets */
function moderatedLabel(l: ListingDetailData): string | null {
  if (l.redaction) return REDACTION[l.redaction]
  if (l.moderation === 'removed') return REDACTION.removed_by_moderation
  if (l.moderation === 'hidden') return REDACTION.hidden_by_moderation
  return null
}

/** A listing: what is asked, its state over time, and the offers and posts about it */
export function ListingDetail({ listing }: { listing: ListingDetailData }) {
  return (
    <RecordDetailLayout
      kind="listings"
      id={listing.id}
      title={listing.title}
      detail={listing}
      badge={
        <span className="flex flex-wrap gap-2">
          <StatusBadge {...LISTING_STATUS[listing.status]} />
          {listing.moderation === 'hidden' && (
            <StatusBadge tone="warning" icon={EyeOff} label={REDACTION.hidden_by_moderation} />
          )}
          {listing.moderation === 'removed' && (
            <StatusBadge tone="danger" icon={ShieldAlert} label="Removed by moderation" />
          )}
        </span>
      }
    >
      <Section title="Details">
        <KeyValueList
          items={[
            { term: 'Seller', value: <RecordLink record={listing.seller} /> },
            { term: 'Item', value: <RecordLink record={listing.item} /> },
            {
              term: 'Asking price',
              value: listing.askingKobo === null ? 'Swap only' : <MoneyText kobo={listing.askingKobo} />,
            },
            { term: 'Accepts', value: listing.modes.map((m) => LISTING_MODE[m]).join(', ') },
            ...(listing.desiredItems ? [{ term: 'Would swap for', value: listing.desiredItems }] : []),
            { term: 'Category', value: listing.category },
            { term: 'Area', value: listing.area },
            ...(listing.urgentUntil
              ? [
                  {
                    term: 'Quick Sell',
                    value: <span className="tabular-nums">Until {formatWAT(listing.urgentUntil)}</span>,
                  },
                ]
              : []),
            {
              term: 'Published',
              value: listing.publishedAt ? (
                <span className="tabular-nums">{formatWAT(listing.publishedAt)}</span>
              ) : (
                'Not published'
              ),
            },
          ]}
        />
        {moderatedLabel(listing) ? (
          <p className="text-body text-muted italic">{moderatedLabel(listing)}</p>
        ) : (
          <blockquote className="rounded-small bg-cloud p-3 text-body whitespace-pre-wrap text-ink">
            {listing.description}
          </blockquote>
        )}
      </Section>
      <Section title="Status history">
        <Timeline label="Status history">
          {[...listing.statusHistory].reverse().map((h) => (
            <li key={`${h.status}-${h.at}`} className="flex flex-wrap items-center gap-2 text-compact">
              <StatusBadge {...LISTING_STATUS[h.status]} />
              <span className="text-muted tabular-nums">{formatWAT(h.at)}</span>
            </li>
          ))}
        </Timeline>
      </Section>
      <Section title="Offers">
        <OfferList rows={listing.offers} />
      </Section>
      <Section title="Feed posts">
        {listing.feedPosts.length === 0 ? (
          <p className="text-compact text-muted">No feed posts</p>
        ) : (
          <ul className="flex flex-col divide-y divide-border text-compact">
            {listing.feedPosts.map((f) => (
              <li key={f.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2 first:pt-0 last:pb-0">
                <RecordLink record={{ kind: 'feed', id: f.id, label: f.id }} />
                <StatusBadge {...FEED_STATUS[f.status]} />
                <span className="text-muted">{f.redaction ? REDACTION[f.redaction] : f.caption}</span>
              </li>
            ))}
          </ul>
        )}
      </Section>
      <Section title="Reports">
        <ReportList rows={listing.reports} empty="No reports about this listing" />
      </Section>
    </RecordDetailLayout>
  )
}
