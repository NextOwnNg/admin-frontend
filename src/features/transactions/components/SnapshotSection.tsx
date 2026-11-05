import { OfferSummary } from '@/components/domain/OfferSummary'
import { Section } from '@/components/ui/Section'
import type { TransactionDetail } from '@/lib/api/types/transactions'
import { formatWAT } from '@/lib/time/time'

/** The agreement frozen at acceptance; later listing edits never change it (QA-08). */
export function SnapshotSection({ tx }: { tx: TransactionDetail }) {
  return (
    <Section title="Agreement snapshot">
      <p className="text-compact text-muted">Agreement at acceptance · read-only</p>
      <p className="text-compact text-muted tabular-nums">Accepted {formatWAT(tx.acceptedAt)}</p>
      <OfferSummary terms={tx.snapshot} />
    </Section>
  )
}
