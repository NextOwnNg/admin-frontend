import { KeyValueList } from '@/components/data/KeyValueList'
import { Section } from '@/components/ui/Section'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { useRecordDetail } from '@/features/records/api/useRecordList'
import { RecordDetailLayout } from '@/features/records/components/RecordDetailLayout'
import { RecordLink } from '@/features/records/components/RecordLink'
import { ReportList } from '@/features/records/components/RecordLists'
import type { FeedDetail as FeedDetailData, RecordRef } from '@/lib/api/types/records'
import { FEED_STATUS, LISTING_STATUS } from '@/lib/copy/records'
import { formatNaira } from '@/lib/money/money'
import { REDACTION } from '@/lib/copy/status'
import { formatWAT } from '@/lib/time/time'

/** The linked listing with its price and status as they are now, read from the listing itself */
function ListingNow({ listing }: { listing: RecordRef }) {
  const now = useRecordDetail('listings', listing.id)
  return (
    <span className="flex flex-wrap items-baseline gap-x-2">
      <RecordLink record={listing} />
      {now.data ? (
        <span className="text-compact text-muted">
          {now.data.askingKobo === null ? 'No asking price' : formatNaira(now.data.askingKobo)} ·{' '}
          {LISTING_STATUS[now.data.status].label}
        </span>
      ) : (
        now.isError && <span className="text-compact text-muted">Price and status unavailable</span>
      )}
    </span>
  )
}

/** A feed post and its public comments. Price and availability live on the listing it points to (PRD §6). */
export function FeedDetail({ post }: { post: FeedDetailData }) {
  return (
    <RecordDetailLayout
      kind="feed"
      id={post.id}
      title={`Post by ${post.author.label}`}
      detail={post}
      badge={<StatusBadge {...FEED_STATUS[post.status]} />}
    >
      <Section title="Post">
        <KeyValueList
          items={[
            { term: 'Author', value: <RecordLink record={post.author} /> },
            { term: 'Listing', value: <ListingNow listing={post.listing} /> },
            { term: 'Posted', value: <span className="tabular-nums">{formatWAT(post.createdAt)}</span> },
          ]}
        />
        {post.redaction ? (
          <p className="text-body text-muted italic">{REDACTION[post.redaction]}</p>
        ) : (
          <blockquote className="rounded-small bg-cloud p-3 text-body whitespace-pre-wrap text-ink">
            {post.caption}
          </blockquote>
        )}
      </Section>
      <Section title={`Comments (${post.comments.length})`}>
        {post.comments.length === 0 ? (
          <p className="text-compact text-muted">No comments</p>
        ) : (
          <ul className="flex flex-col divide-y divide-border">
            {post.comments.map((c) => (
              <li key={c.id} className="flex flex-col gap-1 py-3 text-compact first:pt-0 last:pb-0">
                <p className="flex flex-wrap items-baseline gap-x-2">
                  <RecordLink record={c.author} />
                  <span className="text-caption text-muted tabular-nums">
                    {c.id} · {formatWAT(c.at)}
                  </span>
                </p>
                {c.redaction ? (
                  <p className="text-muted italic">{REDACTION[c.redaction]}</p>
                ) : (
                  <p className="whitespace-pre-wrap text-ink">{c.text}</p>
                )}
              </li>
            ))}
          </ul>
        )}
      </Section>
      <Section title="Reports">
        <ReportList rows={post.reports} empty="No reports about this post" />
      </Section>
    </RecordDetailLayout>
  )
}
