import { useState } from 'react'
import { useParams } from 'react-router'
import { AssignControl } from '@/components/domain/AssignControl'
import { AuditEntry } from '@/components/domain/AuditEntry'
import { BackButton } from '@/components/layout/BackButton'
import { CasePanel } from '@/components/domain/CasePanel'
import { PageHead } from '@/components/seo/PageHead'
import { Banner } from '@/components/ui/Banner'
import { ErrorState, PermissionDenied, TableSkeleton } from '@/components/ui/States'
import { useCase } from '@/features/cases/api/useCase'
import { CaseActions } from '@/features/cases/components/CaseActions'
import { CaseHeader } from '@/features/cases/components/CaseHeader'
import { CaseSummarySection } from '@/features/cases/components/CaseSummarySection'
import { ContentSection } from '@/features/cases/components/ContentSection'
import { EvidenceSection } from '@/features/cases/components/EvidenceSection'
import { HistorySection } from '@/features/cases/components/HistorySection'
import { LinkedTransactionSection } from '@/features/cases/components/LinkedTransactionSection'
import { NotesSection } from '@/features/cases/components/NotesSection'
import { PartiesSection } from '@/features/cases/components/PartiesSection'
import { errorMessage, isConflict, isForbidden, isNotFound } from '@/lib/api/error-message'
import { useAssignCase } from '@/lib/api/reference'
import type { AuditEntry as AuditEntryData } from '@/lib/api/types/audit'
import { NotFoundPage } from '@/pages/NotFoundPage'

/** One case, top to bottom, with its state and actions beside it (UX-28, ADM-FE-03). */
export function CasePage() {
  const { id = '' } = useParams()
  const query = useCase(id)
  const assign = useAssignCase()
  const [recorded, setRecorded] = useState<AuditEntryData | null>(null)

  if (isForbidden(query.error)) {
    // Nothing about the case, not even its number (QA-16)
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
        <PageHead title="Case" />
        <ErrorState onRetry={() => void query.refetch()} />
      </>
    )
  }

  const caseDetail = query.data
  return (
    <>
      <PageHead title={`Case ${id}`} />
      {!caseDetail ? (
        <TableSkeleton rows={6} columns={2} />
      ) : (
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <BackButton fallback="/reports" />
            <CaseHeader caseDetail={caseDetail} />
          </div>
          {recorded && (
            <Banner key={recorded.id} tone="success" title="Recorded" focusOnShow>
              <AuditEntry entry={recorded} />
            </Banner>
          )}
          {assign.isError &&
            (isConflict(assign.error) ? (
              <Banner tone="warning" title="This case changed since you opened it.">
                Review the latest version before acting again.
              </Banner>
            ) : (
              <Banner tone="error" title={errorMessage(assign.error, "The case wasn't assigned.")} />
            ))}
          <div className="grid gap-6 detail:grid-cols-12 detail:items-start">
            <div className="detail:sticky detail:top-[calc(var(--nx-topbar-height)+24px)] detail:order-last detail:col-span-4">
              <CasePanel
                caseDetail={caseDetail}
                assignee={
                  <AssignControl
                    caseSummary={caseDetail}
                    pending={assign.isPending}
                    onAssign={(assigneeId) =>
                      assign.mutate({ caseId: caseDetail.id, assigneeId, expectedVersion: caseDetail.version })
                    }
                  />
                }
              >
                <CaseActions caseDetail={caseDetail} onRecorded={setRecorded} />
              </CasePanel>
            </div>
            <div className="flex min-w-0 flex-col gap-6 detail:col-span-8">
              <CaseSummarySection caseDetail={caseDetail} />
              <PartiesSection caseDetail={caseDetail} />
              <ContentSection caseDetail={caseDetail} />
              <EvidenceSection caseDetail={caseDetail} />
              <LinkedTransactionSection caseDetail={caseDetail} />
              <NotesSection caseDetail={caseDetail} />
              <HistorySection entries={caseDetail.history} />
            </div>
          </div>
        </div>
      )}
    </>
  )
}
