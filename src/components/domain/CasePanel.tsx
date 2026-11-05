import type { ReactNode } from 'react'
import { KeyValueList } from '@/components/data/KeyValueList'
import { CaseStatusBadge } from '@/components/domain/CaseStatusBadge'
import { useNow } from '@/hooks/useNow'
import { useReasonCodes } from '@/lib/api/reference'
import type { CaseDetail } from '@/lib/api/types/cases'
import { DECISION_OUTCOME } from '@/lib/copy/status'
import { dueText, formatWAT, withRelative } from '@/lib/time/time'

type PanelCase = Pick<CaseDetail, 'status' | 'overdue' | 'dueAt' | 'assignee' | 'nextAction' | 'decision'>

/**
 * The case's state and what to do next (design §4.3): status, assignee, due, then the next action, or
 * the decision once it is resolved or closed, then the actions this role may take.
 */
export function CasePanel({
  caseDetail,
  assignee,
  children,
}: {
  caseDetail: PanelCase
  /** Replaces the plain assignee name, e.g. with an assign control */
  assignee?: ReactNode
  children?: ReactNode
}) {
  const now = useNow()
  const reasons = useReasonCodes()
  const { status, overdue, dueAt, decision, nextAction } = caseDetail
  const done = status === 'resolved' || status === 'closed'

  return (
    <section aria-label="Case status" className="flex flex-col gap-4 rounded-card border border-border bg-paper p-5">
      <KeyValueList
        items={[
          { term: 'Status', value: <CaseStatusBadge status={status} overdue={overdue} /> },
          {
            term: 'Assignee',
            value: assignee ?? caseDetail.assignee?.displayName ?? <span className="text-muted">Unassigned</span>,
          },
          ...(done
            ? []
            : [
                {
                  term: 'Due',
                  value: (
                    <span className="flex flex-col tabular-nums">
                      <span className={overdue ? 'font-semibold text-warning' : undefined}>{dueText(dueAt, now)}</span>
                      <span className="text-caption text-muted">{formatWAT(dueAt)}</span>
                    </span>
                  ),
                },
              ]),
        ]}
      />

      {done && decision ? (
        <div className="flex flex-col gap-1 rounded-control bg-mint p-4">
          <h2 className="text-compact font-semibold text-ink">Decision</h2>
          <p className="text-body text-ink">{DECISION_OUTCOME[decision.outcome] ?? decision.outcome}</p>
          <p className="text-compact text-muted">
            {reasons.data?.find((r) => r.code === decision.reasonCode)?.label ?? decision.reasonCode} · {decision.by}
          </p>
          <p className="text-caption text-muted tabular-nums">{withRelative(decision.at, now)}</p>
        </div>
      ) : (
        nextAction && (
          <div className="flex flex-col gap-1 rounded-control bg-mint p-4">
            <h2 className="text-compact font-semibold text-ink">Next action</h2>
            <p className="text-compact text-ink">{nextAction}</p>
          </div>
        )
      )}
      {/* Actions decide for themselves: none on a closed case, but a dialog already open stays open */}
      {children}
    </section>
  )
}
