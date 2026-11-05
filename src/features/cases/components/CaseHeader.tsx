import { CaseStatusBadge } from '@/components/domain/CaseStatusBadge'
import { SeverityBadge } from '@/components/domain/SeverityBadge'
import type { CaseDetail } from '@/lib/api/types/cases'

export function CaseHeader({ caseDetail }: { caseDetail: CaseDetail }) {
  return (
    <header className="flex flex-wrap items-center gap-3">
      <h1 className="text-h1 text-ink tabular-nums">Case {caseDetail.id}</h1>
      <SeverityBadge severity={caseDetail.severity} />
      <CaseStatusBadge status={caseDetail.status} overdue={caseDetail.overdue} />
    </header>
  )
}
