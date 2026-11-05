import { Section } from '@/components/ui/Section'
import { useNow } from '@/hooks/useNow'
import type { TransactionDetail } from '@/lib/api/types/transactions'
import { formatWAT, withRelative } from '@/lib/time/time'

export function ReservationsSection({ tx }: { tx: TransactionDetail }) {
  const now = useNow()
  return (
    <Section title="Reservations">
      <ul className="flex flex-col divide-y divide-border">
        {tx.reservations.map((r) => (
          <li key={r.itemId} className="flex flex-col gap-0.5 py-3 text-compact first:pt-0 last:pb-0">
            <span className="font-semibold text-ink">{r.itemTitle}</span>
            <span className="text-muted tabular-nums">
              Reserved {formatWAT(r.reservedAt)} · expires {formatWAT(r.expiresAt)}
            </span>
            {r.releasedAt ? (
              <span className="text-ink tabular-nums">
                Released {withRelative(r.releasedAt, now)}
                {r.releaseReason && <span className="text-muted"> · {r.releaseReason}</span>}
              </span>
            ) : (
              <span className="text-muted">Still reserved</span>
            )}
          </li>
        ))}
      </ul>
    </Section>
  )
}
