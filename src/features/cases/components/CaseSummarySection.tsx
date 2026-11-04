import { KeyValueList } from '@/components/data/KeyValueList'
import { Section } from '@/components/ui/Section'
import { useNow } from '@/hooks/useNow'
import { useReasonCodes } from '@/lib/api/reference'
import type { CaseDetail } from '@/lib/api/types/cases'
import { TARGET_TYPE_LABELS } from '@/lib/copy/labels'
import { formatUTC, withRelative } from '@/lib/time/time'

export function CaseSummarySection({ caseDetail }: { caseDetail: CaseDetail }) {
  const now = useNow()
  const reasons = useReasonCodes()
  const reasonLabel = (code: string) => reasons.data?.find((r) => r.code === code)?.label ?? code
  const { reports } = caseDetail

  return (
    <Section title="Summary">
      <p className="text-body whitespace-pre-wrap text-ink">{caseDetail.description}</p>
      <KeyValueList
        items={[
          { term: 'Type', value: TARGET_TYPE_LABELS[caseDetail.type] },
          { term: 'Flag', value: reasonLabel(caseDetail.reasonCode) },
          {
            term: 'Opened',
            value: (
              <span className="tabular-nums" title={formatUTC(caseDetail.openedAt)}>
                {withRelative(caseDetail.openedAt, now)}
              </span>
            ),
          },
          { term: 'Reports', value: reports.length === 1 ? '1 report' : `${reports.length} reports` },
        ]}
      />
      {reports.length > 1 && (
        <ul aria-label="Grouped reports" className="flex flex-col gap-1 border-t border-border pt-3 text-compact">
          {reports.map((r) => (
            <li key={`${r.reporterName}-${r.at}`} className="flex flex-wrap gap-x-2">
              <span className="text-ink">{r.reporterName}</span>
              <span className="text-muted">{reasonLabel(r.reasonCode)}</span>
              <span className="text-muted tabular-nums">{withRelative(r.at, now)}</span>
            </li>
          ))}
        </ul>
      )}
    </Section>
  )
}
