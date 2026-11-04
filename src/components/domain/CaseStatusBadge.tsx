import { StatusBadge } from '@/components/ui/StatusBadge'
import { CASE_STATUS, OVERDUE, type CaseStatus } from '@/lib/copy/status'

/** Case status, plus "Overdue" beside it when past due (overdue is a flag, not a status). */
export function CaseStatusBadge({ status, overdue = false }: { status: CaseStatus; overdue?: boolean }) {
  return (
    <span className="inline-flex flex-wrap items-center gap-1.5">
      <StatusBadge {...CASE_STATUS[status]} />
      {overdue && <StatusBadge {...OVERDUE} />}
    </span>
  )
}
