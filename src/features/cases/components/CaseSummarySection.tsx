import { KeyValueList } from '@/components/data/KeyValueList'
import { Section } from '@/components/ui/Section'
import { useNow } from '@/hooks/useNow'
import { useReasonCodes } from '@/lib/api/reference'
import type { CaseDetail } from '@/lib/api/types/cases'
import { TARGET_TYPE_LABELS } from '@/lib/copy/labels'
import { RecordLink } from '@/features/records/components/RecordLink'
import { canAccess } from '@/lib/permissions/permissions'
import { formatUTC, formatWAT, withRelative } from '@/lib/time/time'
import { useSessionStore } from '@/stores/session'

export function CaseSummarySection({ caseDetail }: { caseDetail: CaseDetail }) {
  const now = useNow()
  const reasons = useReasonCodes()
  const reasonLabel = (code: string) => reasons.data?.find((r) => r.code === code)?.label ?? code
  const { reports } = caseDetail
  // Listing records are for moderators and administrators
  const canBrowse = canAccess(
    'records',
    useSessionStore((s) => s.roles),
  )

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
          caseDetail.kind === 'appeal'
            ? { term: 'Reports', value: 'Appeal from the member' }
            : {
                term: 'Reports',
                value:
                  reports.length === 0
                    ? 'Opened by the system'
                    : reports.length === 1
                      ? '1 report'
                      : `${reports.length} reports`,
              },
          ...(caseDetail.duplicateOf
            ? [
                {
                  term: 'Possible duplicate of',
                  value: canBrowse ? (
                    <RecordLink record={caseDetail.duplicateOf} />
                  ) : (
                    <span>
                      {caseDetail.duplicateOf.label}{' '}
                      <span className="text-caption text-muted tabular-nums">{caseDetail.duplicateOf.id}</span>
                    </span>
                  ),
                },
              ]
            : []),
        ]}
      />
      {caseDetail.appeal && (
        <div className="flex flex-col gap-2 border-t border-border pt-3">
          <h3 className="text-compact font-semibold text-ink">Appeal</h3>
          <p className="text-compact text-ink tabular-nums">
            {caseDetail.appeal.liftedAt
              ? `Restriction lifted ${formatWAT(caseDetail.appeal.liftedAt)}`
              : `Restricted until ${formatWAT(caseDetail.appeal.restrictedUntil)}`}
          </p>
          <p className="text-compact text-muted">For: {reasonLabel(caseDetail.appeal.reasonCode)}</p>
          <blockquote className="rounded-small bg-cloud p-3 text-body whitespace-pre-wrap text-ink">
            {caseDetail.appeal.statement}
          </blockquote>
        </div>
      )}
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
