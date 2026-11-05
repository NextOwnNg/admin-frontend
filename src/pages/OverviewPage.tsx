import { Link } from 'react-router'
import { PageHead } from '@/components/seo/PageHead'
import { ErrorState } from '@/components/ui/States'
import { SeverityBadge } from '@/components/domain/SeverityBadge'
import { useOverview } from '@/features/overview/api/useOverview'
import { MyCasesTable } from '@/features/overview/components/MyCasesTable'
import { SeverityCounts } from '@/features/overview/components/SeverityCounts'
import { isForbidden } from '@/lib/api/error-message'
import { REDACTION } from '@/lib/copy/status'
import { formatWAT } from '@/lib/time/time'

/** Where the day starts (design §4.1): my cases, open work by severity, what's overdue. */
export function OverviewPage() {
  const overview = useOverview()
  const data = overview.data
  const status = overview.isPending
    ? 'pending'
    : isForbidden(overview.error)
      ? 'forbidden'
      : overview.isError
        ? 'error'
        : 'success'

  return (
    <>
      <PageHead title="Overview" />
      <div className="flex flex-col gap-8">
        <h1 className="text-h1 text-ink">Overview</h1>
        {overview.isError && !data ? (
          <ErrorState onRetry={() => void overview.refetch()} />
        ) : (
          <>
            {data && <SeverityCounts counts={data.openBySeverity} />}

            <section aria-labelledby="my-cases" className="flex flex-col gap-3">
              <div className="flex items-center justify-between gap-3">
                <h2 id="my-cases" className="text-h3 text-ink">
                  My cases
                </h2>
                <Link
                  to="/reports?assignee=me"
                  aria-label="View all my cases"
                  className="text-compact font-semibold text-action underline underline-offset-2"
                >
                  View all
                </Link>
              </div>
              <MyCasesTable rows={data?.myCases} status={status} onRetry={() => void overview.refetch()} />
            </section>

            {data && (
              <section
                aria-labelledby="overdue"
                className="flex flex-col gap-3 rounded-card border border-border bg-paper p-5"
              >
                <h2 id="overdue" className="text-h3 text-ink">
                  Overdue
                </h2>
                <p className="text-body text-ink tabular-nums">
                  {data.overdueCount === 0
                    ? 'Nothing is overdue.'
                    : `${data.overdueCount} ${data.overdueCount === 1 ? 'case is' : 'cases are'} past due. Oldest first:`}
                </p>
                {data.oldestOverdue.length > 0 && (
                  <ul className="flex flex-col divide-y divide-border">
                    {data.oldestOverdue.map((c) => (
                      <li key={c.id} className="flex flex-wrap items-center gap-3 py-2 text-compact">
                        <SeverityBadge severity={c.severity} />
                        <Link
                          to={`/cases/${c.id}`}
                          className="font-semibold text-ink tabular-nums underline-offset-2 hover:underline"
                        >
                          {c.id}
                        </Link>
                        <span className="text-muted">{c.redaction ? REDACTION[c.redaction] : c.summary}</span>
                        <span className="ml-auto text-warning tabular-nums">Was due {formatWAT(c.dueAt)}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            )}
          </>
        )}
      </div>
    </>
  )
}
