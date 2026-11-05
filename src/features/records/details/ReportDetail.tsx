import { KeyValueList } from '@/components/data/KeyValueList'
import { Section } from '@/components/ui/Section'
import { ReasonText } from '@/features/records/components/ReasonText'
import { RecordDetailLayout } from '@/features/records/components/RecordDetailLayout'
import { RecordLink } from '@/features/records/components/RecordLink'
import type { ReportDetail as ReportDetailData } from '@/lib/api/types/records'
import { TARGET_TYPE_LABELS } from '@/lib/copy/labels'
import { formatWAT } from '@/lib/time/time'

const evidenceLine = (n: number) =>
  n === 0 ? 'No evidence attached' : `${n} evidence ${n === 1 ? 'file' : 'files'}: open the case to view them`

/** One member's report. Evidence opens only inside its case, behind a reason (ADM-T-02). */
export function ReportDetail({ report }: { report: ReportDetailData }) {
  return (
    <RecordDetailLayout kind="reports" id={report.id} title={`Report ${report.id}`} detail={report}>
      <Section title="Report">
        <KeyValueList
          items={[
            { term: 'Reporter', value: <RecordLink record={report.reporter} /> },
            {
              term: 'Reported',
              value: (
                <span>
                  {TARGET_TYPE_LABELS[report.targetType]} · <RecordLink record={report.target} />
                </span>
              ),
            },
            { term: 'Reason', value: <ReasonText code={report.reasonCode} /> },
            { term: 'Received', value: <span className="tabular-nums">{formatWAT(report.receivedAt)}</span> },
            { term: 'Case', value: <RecordLink record={report.case} /> },
            { term: 'Evidence', value: evidenceLine(report.evidenceCount) },
          ]}
        />
        <blockquote className="rounded-small bg-cloud p-3 text-body whitespace-pre-wrap text-ink">
          {report.description}
        </blockquote>
      </Section>
    </RecordDetailLayout>
  )
}
