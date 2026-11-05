import { Inbox, SearchX } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router'
import { Pagination } from '@/components/data/Pagination'
import type { RowAction } from '@/components/data/DataTable'
import { AssignDialog } from '@/components/domain/AssignControl'
import { PageHead } from '@/components/seo/PageHead'
import { Banner } from '@/components/ui/Banner'
import { PlainButton } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/States'
import { useCases } from '@/features/queue/api/useCases'
import { QueueFilters } from '@/features/queue/components/QueueFilters'
import { QueueTable } from '@/features/queue/components/QueueTable'
import { queueFilterSchema } from '@/features/queue/schemas'
import { useCursorStack } from '@/hooks/useCursorStack'
import { useUrlFilters } from '@/hooks/useUrlFilters'
import { errorMessage, isConflict, isForbidden } from '@/lib/api/error-message'
import { useAssignCase, type AssignVariables } from '@/lib/api/reference'
import type { CaseSummary } from '@/lib/api/types/cases'
import { useSessionStore } from '@/stores/session'

/** The moderation queue (UX-27, ADM-FE-02): triage, assign, open. */
export function ReportsQueuePage() {
  const navigate = useNavigate()
  const { staffId, roles } = useSessionStore()
  const canAssign = roles.some((r) => r !== 'support_agent')
  const { filters, present, setFilter, clear } = useUrlFilters(queueFilterSchema)
  const pages = useCursorStack(filters)
  const cases = useCases(filters)
  const assign = useAssignCase()
  const [assigning, setAssigning] = useState<CaseSummary | null>(null)

  const assignTo = (row: CaseSummary, assigneeId: string | null) => {
    const variables: AssignVariables = { caseId: row.id, assigneeId, expectedVersion: row.version }
    assign.mutate(variables)
  }

  const rowActions = (row: CaseSummary): RowAction[] => {
    const open = { label: 'Open case', onAction: () => void navigate(`/cases/${row.id}`) }
    const terminal = row.status === 'closed' || row.status === 'resolved'
    if (!canAssign || terminal) return [open]
    return [
      ...(row.assignee?.staffId !== staffId && staffId
        ? [{ label: 'Assign to me', onAction: () => assignTo(row, staffId) }]
        : []),
      { label: 'Assign to…', onAction: () => setAssigning(row) },
      ...(row.assignee ? [{ label: 'Unassign', onAction: () => assignTo(row, null) }] : []),
      open,
    ]
  }

  const hasFilters = Object.keys(present).some((key) => key !== 'cursor' && key !== 'sort')
  const status = cases.isPending
    ? 'pending'
    : isForbidden(cases.error)
      ? 'forbidden'
      : cases.isError
        ? 'error'
        : 'success'
  const page = cases.data

  return (
    <>
      <PageHead title="Reports" />
      <div className="flex flex-col gap-6">
        <h1 className="text-h1 text-ink">Reports</h1>

        {assign.isError &&
          (isConflict(assign.error) ? (
            <Banner tone="warning" title="This case changed since you opened it.">
              Review the latest version before acting again.
            </Banner>
          ) : (
            <Banner tone="error" title={errorMessage(assign.error, 'The case wasn’t assigned.')} />
          ))}

        <QueueFilters
          filters={filters}
          present={present}
          setFilter={setFilter}
          onClear={clear}
          canFilterAssignee={canAssign}
        />

        <QueueTable
          rows={page?.items}
          status={status}
          onRetry={() => void cases.refetch()}
          sort={filters.sort}
          onSortChange={(sort) => setFilter('sort', sort)}
          rowActions={rowActions}
          empty={
            hasFilters ? (
              <EmptyState
                icon={SearchX}
                title="No reports match these filters"
                body="Try fewer filters, or clear them to see the whole queue."
                action={
                  <PlainButton variant="secondary" onClick={clear}>
                    Clear filters
                  </PlainButton>
                }
              />
            ) : (
              <EmptyState icon={Inbox} title="No open reports" body="New reports appear here as members send them." />
            )
          }
        />

        {page && page.items.length > 0 && (
          <Pagination
            label="Reports"
            shown={page.items.length}
            total={page.total}
            hasNext={Boolean(page.nextCursor)}
            hasPrevious={pages.hasPrevious}
            onNext={() => {
              pages.push()
              setFilter('cursor', page.nextCursor ?? undefined)
            }}
            onPrevious={() => {
              setFilter('cursor', pages.pop())
            }}
          />
        )}
      </div>

      {assigning && (
        <AssignDialog
          caseId={assigning.id}
          currentAssigneeId={assigning.assignee?.staffId ?? null}
          open
          onOpenChange={(open) => !open && setAssigning(null)}
          onAssign={(id) => assignTo(assigning, id)}
        />
      )}
    </>
  )
}
