import { Link } from 'react-router'
import type { ExceptionQueue } from '@/lib/api/types/exceptions'
import { EXCEPTION_QUEUE, EXCEPTION_QUEUES } from '@/lib/copy/exceptions'
import { cx } from '@/lib/cx'

/** One tab per queue, each with its count; the queue lives in the address */
export function ExceptionTabs({
  current,
  counts,
}: {
  current: ExceptionQueue
  counts: Record<ExceptionQueue, number> | undefined
}) {
  return (
    <nav aria-label="Exception queues" className="border-b border-border">
      {/* Wraps rather than scrolls, so every queue and its count stays in view at 1024 px */}
      <ul className="flex flex-wrap gap-x-1">
        {EXCEPTION_QUEUES.map((queue) => (
          <li key={queue}>
            <Link
              to={`/exceptions?queue=${queue}`}
              aria-current={queue === current ? 'page' : undefined}
              className={cx(
                'inline-flex h-11 items-center gap-1.5 border-b-2 px-3 text-compact font-semibold whitespace-nowrap transition-colors duration-120',
                queue === current ? 'border-action text-action' : 'border-transparent text-muted hover:text-ink',
              )}
            >
              {EXCEPTION_QUEUE[queue]}
              {counts && <span className="tabular-nums"> ({counts[queue]})</span>}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  )
}
