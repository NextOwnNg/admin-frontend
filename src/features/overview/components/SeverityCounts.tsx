import { Link } from 'react-router'
import type { Overview } from '@/lib/api/types/reference'
import { cx } from '@/lib/cx'
import { SEVERITIES, SEVERITY } from '@/lib/copy/status'

/** Open cases by severity, each a way into the filtered queue (design §4.1). */
export function SeverityCounts({ counts }: { counts: Overview['openBySeverity'] }) {
  return (
    <ul aria-label="Open by severity" className="grid gap-3 tablet:grid-cols-2 desktop:grid-cols-4">
      {SEVERITIES.map((s) => {
        const { label, icon: Icon } = SEVERITY[s]
        // Danger tone only when there is urgent work
        const urgent = s === 'S1' && counts[s] > 0
        return (
          <li key={s}>
            <Link
              to={`/reports?severity=${s}`}
              className={cx(
                'flex flex-col gap-2 rounded-card border p-5 transition-colors hover:bg-cloud',
                urgent ? 'border-danger/40 bg-danger/5' : 'border-border bg-paper',
              )}
            >
              <span
                className={cx(
                  'flex items-center gap-1.5 text-compact font-semibold',
                  urgent ? 'text-danger' : 'text-muted',
                )}
              >
                <Icon aria-hidden className="size-4" />
                {label}
              </span>{' '}
              {/* The name starts with what's on screen, so voice control users can say it (WCAG 2.5.3) */}
              <span className="text-h2 text-ink tabular-nums">
                {counts[s]} <span className="sr-only">open</span>
              </span>
            </Link>
          </li>
        )
      })}
    </ul>
  )
}
