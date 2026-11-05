import { useState } from 'react'
import { useParams, useSearchParams } from 'react-router'
import { AuditEntry } from '@/components/domain/AuditEntry'
import { BackButton } from '@/components/layout/BackButton'
import { TransactionStatusBadge } from '@/components/domain/TransactionStatusBadge'
import { PageHead } from '@/components/seo/PageHead'
import { Banner } from '@/components/ui/Banner'
import { ErrorState, PermissionDenied, TableSkeleton } from '@/components/ui/States'
import { HistorySection } from '@/features/cases/components/HistorySection'
import { LinkedRecordsPanel } from '@/features/records/components/LinkedRecordsPanel'
import { useTransaction } from '@/features/transactions/api/useTransaction'
import { ConfirmationsSection } from '@/features/transactions/components/ConfirmationsSection'
import { ReservationsSection } from '@/features/transactions/components/ReservationsSection'
import { SnapshotSection } from '@/features/transactions/components/SnapshotSection'
import { TransactionPanel } from '@/features/transactions/components/TransactionPanel'
import { VersionsSection } from '@/features/transactions/components/VersionsSection'
import { isForbidden, isNotFound } from '@/lib/api/error-message'
import type { AuditEntry as AuditEntryData } from '@/lib/api/types/audit'
import { canAccess } from '@/lib/permissions/permissions'
import { NotFoundPage } from '@/pages/NotFoundPage'
import { useSessionStore } from '@/stores/session'

const CASE_ID = /^[A-Z]{2}-\d{1,12}$/

/** What both people agreed and confirmed, read-only (UX-28, ADM-FE-04). */
export function TransactionPage() {
  const { id = '' } = useParams()
  const [params] = useSearchParams()
  // The case this was opened from authorises other staff (design §9a.2); anything malformed is ignored
  const caseParam = params.get('case')
  const caseId = caseParam && CASE_ID.test(caseParam) ? caseParam : undefined
  const query = useTransaction(id, caseId)
  const [recorded, setRecorded] = useState<AuditEntryData | null>(null)
  const canBrowse = canAccess(
    'records',
    useSessionStore((s) => s.roles),
  )

  if (isForbidden(query.error)) {
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
        <PageHead title="Transaction" />
        <ErrorState onRetry={() => void query.refetch()} />
      </>
    )
  }

  const tx = query.data
  return (
    <>
      <PageHead title={`Transaction ${id}`} />
      {!tx ? (
        <TableSkeleton rows={6} columns={2} />
      ) : (
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            {/* Opened through a case, back is that case; otherwise the transactions list (or the queue) */}
            <BackButton fallback={caseId ? `/cases/${caseId}` : canBrowse ? '/records/transactions' : '/reports'} />
            <header className="flex flex-wrap items-center gap-3">
              <h1 className="text-h1 text-ink tabular-nums">Transaction {tx.id}</h1>
              <TransactionStatusBadge status={tx.status} />
            </header>
          </div>
          {recorded && (
            <Banner tone="success" title="Recorded">
              <AuditEntry entry={recorded} />
            </Banner>
          )}
          <div className="grid gap-6 detail:grid-cols-12 detail:items-start">
            <div className="detail:sticky detail:top-[calc(var(--nx-topbar-height)+24px)] detail:order-last detail:col-span-4">
              <div className="flex flex-col gap-6">
                <TransactionPanel tx={tx} caseId={caseId} onRecorded={setRecorded} />
                {tx.links && <LinkedRecordsPanel groups={tx.links} />}
              </div>
            </div>
            <div className="flex min-w-0 flex-col gap-6 detail:col-span-8">
              <SnapshotSection tx={tx} />
              <VersionsSection tx={tx} />
              <ConfirmationsSection tx={tx} />
              <ReservationsSection tx={tx} />
              <HistorySection title="Cancellation, dispute and audit history" entries={tx.history} />
            </div>
          </div>
        </div>
      )}
    </>
  )
}
