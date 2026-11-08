import { CircleCheck } from 'lucide-react'
import { useEffect, useState } from 'react'
import type { RowAction } from '@/components/data/DataTable'
import { AssignDialog } from '@/components/domain/AssignControl'
import { z } from 'zod'
import { Pagination } from '@/components/data/Pagination'
import { PageHead } from '@/components/seo/PageHead'
import { Banner } from '@/components/ui/Banner'
import { EmptyState } from '@/components/ui/States'
import { useExceptions } from '@/features/exceptions/api/useExceptions'
import { ExceptionTable } from '@/features/exceptions/components/ExceptionTable'
import { ExceptionTabs } from '@/features/exceptions/components/ExceptionTabs'
import { NextActionCell } from '@/features/exceptions/components/NextActionCell'
import { useCursorStack } from '@/hooks/useCursorStack'
import { CURSOR, useUrlFilters } from '@/hooks/useUrlFilters'
import { errorMessage, isCaseResolved, isConflict, isForbidden } from '@/lib/api/error-message'
import { useAssignCase } from '@/lib/api/reference'
import type { ExceptionQueue, ExceptionRow } from '@/lib/api/types/exceptions'
import { EXCEPTION_QUEUE, EXCEPTION_QUEUES } from '@/lib/copy/exceptions'
import { canAccess } from '@/lib/permissions/permissions'
import { useSessionStore } from '@/stores/session'

const schema = z.object({ queue: z.enum(EXCEPTION_QUEUES).optional(), cursor: CURSOR.optional() })

/** Exception queues (ADM-FE-08): stuck work, each row with a visible next action. */
export function ExceptionsPage() {
  const { staffId, roles } = useSessionStore()
  const supportOnly = !roles.includes('administrator')
  const { filters, setFilters } = useUrlFilters(schema)
  // No queue chosen: open on the first one with work, chosen once per visit so the tab never jumps.
  // Every answer carries all the counts, so the probe is the first queue's page and stops once chosen.
  const [defaultQueue, setDefaultQueue] = useState<ExceptionQueue | null>(null)
  const probe = useExceptions('partial_confirmation', undefined, {
    enabled: !filters.queue && defaultQueue === null,
    poll: false,
  })
  const counts = probe.data?.counts
  if (!filters.queue && defaultQueue === null && counts) {
    setDefaultQueue(EXCEPTION_QUEUES.find((q) => counts[q] > 0) ?? 'partial_confirmation')
  }
  const queue: ExceptionQueue = filters.queue ?? defaultQueue ?? 'partial_confirmation'
  // A page cursor belongs to the queue named beside it
  const cursor = filters.queue ? filters.cursor : undefined
  const list = useExceptions(queue, cursor, { enabled: Boolean(filters.queue) || defaultQueue !== null })
  const pages = useCursorStack(filters)
  const assign = useAssignCase()
  const [assigning, setAssigning] = useState<ExceptionRow | null>(null)
  const label = EXCEPTION_QUEUE[queue]

  // A banner about one queue's row means nothing on another tab
  const { reset } = assign
  useEffect(() => reset(), [queue, reset])

  const assignTo = (row: ExceptionRow, assigneeId: string | null) =>
    assign.mutate({ caseId: row.caseId, assigneeId, expectedVersion: row.caseVersion })
  const rowActions = (row: ExceptionRow): RowAction[] => [
    ...(row.assignee?.staffId !== staffId && staffId
      ? [{ label: 'Assign to me', onAction: () => assignTo(row, staffId) }]
      : []),
    { label: 'Assign to…', onAction: () => setAssigning(row) },
    ...(row.assignee ? [{ label: 'Unassign', onAction: () => assignTo(row, null) }] : []),
  ]

  const status = list.isPending ? 'pending' : isForbidden(list.error) ? 'forbidden' : list.isError ? 'error' : 'success'
  const page = list.data

  return (
    <>
      <PageHead title="Exceptions" />
      <div className="flex flex-col gap-6">
        <h1 className="text-h1 text-ink">Exceptions</h1>
        <ExceptionTabs current={queue} counts={page?.counts ?? counts} />

        {assign.isError &&
          (isCaseResolved(assign.error) ? (
            <Banner tone="warning" title="This case was already resolved." />
          ) : isConflict(assign.error) ? (
            <Banner tone="warning" title="This case changed since you opened it.">
              Review the latest version before acting again.
            </Banner>
          ) : (
            <Banner tone="error" title={errorMessage(assign.error, "The case wasn't assigned.")} />
          ))}

        <ExceptionTable
          label={label}
          rows={page?.items}
          status={status}
          onRetry={() => void list.refetch()}
          canOpenCase={(row) => !supportOnly || row.assignee?.staffId === staffId}
          canBrowse={canAccess('records', roles)}
          rowActions={supportOnly ? undefined : rowActions}
          nextAction={(row) => (
            <NextActionCell
              row={row}
              mustAssign={supportOnly && row.assignee?.staffId !== staffId}
              heldBy={supportOnly && row.assignee && row.assignee.staffId !== staffId ? row.assignee.displayName : null}
              pending={assign.isPending}
              onAssign={() => staffId && assignTo(row, staffId)}
            />
          )}
          empty={
            <EmptyState
              icon={CircleCheck}
              title={`Nothing waiting in ${label}`}
              body="New items appear here as soon as they need attention."
            />
          }
        />

        {page && page.items.length > 0 && (
          <Pagination
            label={label}
            shown={page.items.length}
            total={page.total}
            hasNext={Boolean(page.nextCursor)}
            hasPrevious={pages.hasPrevious}
            onNext={() => {
              pages.push()
              setFilters({ queue, cursor: page.nextCursor ?? undefined })
            }}
            onPrevious={() => setFilters({ queue, cursor: pages.pop() })}
          />
        )}
      </div>

      {assigning && (
        <AssignDialog
          caseId={assigning.caseId}
          currentAssigneeId={assigning.assignee?.staffId ?? null}
          open
          onOpenChange={(open) => !open && setAssigning(null)}
          onAssign={(id) => assignTo(assigning, id)}
        />
      )}
    </>
  )
}
