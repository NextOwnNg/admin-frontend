import { KeyValueList } from '@/components/data/KeyValueList'
import { StatusBadge } from '@/components/ui/StatusBadge'
import type { Confirmation } from '@/lib/api/types/transactions'
import { confirmationCount, TRANSACTION_FLAG, type TransactionFlag } from '@/lib/copy/status'
import { formatWAT } from '@/lib/time/time'

const answer = (value: boolean | null) => (value === null ? 'Not recorded' : value ? 'Yes' : 'No')

/**
 * Each participant's own confirmation as they reported it (design §4.4). Read-only: staff never
 * confirm, edit or simulate a confirmation (ADM-FE-04, ADM-T-01), so there are no controls here.
 */
export function ConfirmationEvents({ events, flags }: { events: Confirmation[]; flags: TransactionFlag[] }) {
  const confirmed = events.filter((e) => e.confirmedAt).length as 0 | 1 | 2
  return (
    <div className="flex flex-col gap-3">
      <p className="flex flex-wrap items-center gap-2">
        <span className="text-body font-semibold text-ink">{confirmationCount(confirmed)}</span>
        {flags.includes('DISPUTED') && <StatusBadge {...TRANSACTION_FLAG.DISPUTED} />}
      </p>
      <ul className="grid gap-3 tablet:grid-cols-2">
        {events.map((e) => (
          <li key={e.participant} className="flex flex-col gap-2 rounded-control border border-border p-4">
            <p className="text-compact">
              <span className="font-semibold text-ink">{e.displayName}</span>
              <span className="text-muted"> · Participant {e.participant}</span>
            </p>
            {e.confirmedAt ? (
              <>
                <p className="flex flex-col text-compact">
                  <span className="text-ink">Confirmed exchange (self-reported)</span>
                  <span className="text-muted tabular-nums">{formatWAT(e.confirmedAt)}</span>
                </p>
                <KeyValueList
                  items={[
                    { term: 'Inspected items (self-reported)', value: answer(e.inspectedItems) },
                    { term: 'Cash handled (self-reported)', value: answer(e.cashHandled) },
                  ]}
                />
              </>
            ) : (
              <p className="text-compact text-muted">Not confirmed</p>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}
