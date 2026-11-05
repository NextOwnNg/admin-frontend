import type { ReactNode } from 'react'
import { useParams } from 'react-router'
import { PageHead } from '@/components/seo/PageHead'
import { ErrorState, PermissionDenied, TableSkeleton } from '@/components/ui/States'
import { useRecordDetail } from '@/features/records/api/useRecordList'
import { FeedDetail } from '@/features/records/details/FeedDetail'
import { ItemDetail } from '@/features/records/details/ItemDetail'
import { ListingDetail } from '@/features/records/details/ListingDetail'
import { MemberDetail } from '@/features/records/details/MemberDetail'
import { OfferDetail } from '@/features/records/details/OfferDetail'
import { ReportDetail } from '@/features/records/details/ReportDetail'
import { isForbidden, isNotFound } from '@/lib/api/error-message'
import type { DetailKind, RecordDetailFor } from '@/lib/api/types/records'
import { RECORD_KIND_SINGULAR } from '@/lib/copy/records'
import { NotFoundPage } from '@/pages/NotFoundPage'

/** Each kind's page body, given its loaded record */
const RENDER: { [K in DetailKind]: (detail: RecordDetailFor[K]) => ReactNode } = {
  users: (d) => <MemberDetail member={d} />,
  items: (d) => <ItemDetail item={d} />,
  listings: (d) => <ListingDetail listing={d} />,
  offers: (d) => <OfferDetail offer={d} />,
  feed: (d) => <FeedDetail post={d} />,
  reports: (d) => <ReportDetail report={d} />,
}

/** `/records/:kind/:id` (ADM-FE-07). Remounted per id by the router, so nothing carries between records. */
export function RecordDetailPage() {
  const { kind, id = '' } = useParams()
  const detailKind = kind as DetailKind
  const query = useRecordDetail(detailKind, id)
  const label = RECORD_KIND_SINGULAR[detailKind] ?? 'Record'

  if (isForbidden(query.error)) {
    // Nothing about the record, not even its name (QA-16)
    return (
      <>
        <PageHead title="No permission" />
        <PermissionDenied />
      </>
    )
  }
  if (isNotFound(query.error)) return <NotFoundPage />
  if (query.isError && !query.data) {
    return (
      <>
        <PageHead title={label} />
        <ErrorState onRetry={() => void query.refetch()} />
      </>
    )
  }
  return (
    <>
      <PageHead title={`${label} ${id}`} />
      {query.data ? (
        (RENDER[detailKind] as (d: RecordDetailFor[DetailKind]) => ReactNode)(query.data)
      ) : (
        <TableSkeleton rows={6} columns={2} />
      )}
    </>
  )
}
