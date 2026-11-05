import { Link } from 'react-router'
import type { RecordRef } from '@/lib/api/types/records'
import { recordHref } from '@/lib/copy/records'

/**
 * A record by its name or title, linking to its page. The ID follows unless the label already says it, or
 * `showId` is off where an ID column sits beside it.
 */
export function RecordLink({ record, showId = true }: { record: RecordRef; showId?: boolean }) {
  return (
    <Link to={recordHref(record)} className="font-medium text-action underline-offset-2 hover:underline">
      {record.label}
      {showId && !record.label.includes(record.id) && (
        <>
          {' '}
          <span className="text-caption text-muted tabular-nums">{record.id}</span>
        </>
      )}
    </Link>
  )
}
