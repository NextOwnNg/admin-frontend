import { CaseStatusBadge } from '@/components/domain/CaseStatusBadge'
import { SeverityBadge } from '@/components/domain/SeverityBadge'
import { Section } from '@/components/ui/Section'
import { RecordLink } from '@/features/records/components/RecordLink'
import type { RecordCase } from '@/lib/api/types/records'
import { REDACTION } from '@/lib/copy/status'

/** Open and closed cases about this record; acting on it starts from one of them */
export function RecordCasesList({ cases }: { cases: RecordCase[] }) {
  return (
    <Section title="Cases">
      {cases.length === 0 ? (
        <p className="text-compact text-muted">No cases about this record</p>
      ) : (
        <ul className="flex flex-col divide-y divide-border">
          {cases.map((c) => (
            <li key={c.id} className="flex flex-col gap-1.5 py-2.5 first:pt-0 last:pb-0">
              <div className="flex flex-wrap items-center gap-2">
                <RecordLink record={{ kind: 'cases', id: c.id, label: c.id }} />
                <SeverityBadge severity={c.severity} />
                <CaseStatusBadge status={c.status} />
              </div>
              <p className="text-compact text-muted">{c.redaction ? REDACTION[c.redaction] : c.summary}</p>
            </li>
          ))}
        </ul>
      )}
    </Section>
  )
}
