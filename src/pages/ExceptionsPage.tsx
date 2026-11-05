import { CircleCheck } from 'lucide-react'
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
import { errorMessage, isConflict, isForbidden } from '@/lib/api/error-message'
import { useAssignCase } from '@/lib/api/reference'
import type { ExceptionQueue } from '@/lib/api/types/exceptions'
import { EXCEPTION_QUEUE, EXCEPTION_QUEUES } from '@/lib/copy/exceptions'
import { canAccess } from '@/lib/permissions/permissions'
import { useSessionStore } from '@/stores/session'

const schema = z.object({ queue: z.enum(EXCEPTION_QUEUES).optional(), cursor: CURSOR.optional() })

/** Exception queues (ADM-FE-08): stuck work, each row with a visible next action. */
export function ExceptionsPage() {
  const { staffId, roles } = useSessionStore()
  const supportOnly = !roles.includes('administrator')
  const { filters, setFilter } = useUrlFilters(schema)
  // No queue chosen: the first one with work; the first queue's answer carries every count
  const probe = useExceptions('partial_confirmation')
  const counts = probe.data?.counts
  const queue: ExceptionQueue =
    filters.queue ?? EXCEPTION_QUEUES.find((q) => (counts?.[q] ?? 0) > 0) ?? 'partial_confirmation'
  const list = useExceptions(queue, filters.cursor)
  const pages = useCursorStack(filters)
  const assign = useAssignCase()
  const label = EXCEPTION_QUEUE[queue]

  const status = list.isPending ? 'pending' : isForbidden(list.error) ? 'forbidden' : list.isError ? 'error' : 'success'
  const page = list.data

  return (
    <>
      <PageHead title="Exceptions" />
      <div className="flex flex-col gap-6">
        <h1 className="text-h1 text-ink">Exceptions</h1>
        <ExceptionTabs current={queue} counts={page?.counts ?? counts} />

        {assign.isError &&
          (isConflict(assign.error) ? (
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
          nextAction={(row) => (
            <NextActionCell
              row={row}
              mustAssign={supportOnly && row.assignee?.staffId !== staffId}
              heldBy={supportOnly && row.assignee && row.assignee.staffId !== staffId ? row.assignee.displayName : null}
              pending={assign.isPending}
              onAssign={() =>
                staffId && assign.mutate({ caseId: row.caseId, assigneeId: staffId, expectedVersion: row.caseVersion })
              }
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
              setFilter('cursor', page.nextCursor ?? undefined)
            }}
            onPrevious={() => setFilter('cursor', pages.pop())}
          />
        )}
      </div>
    </>
  )
}
