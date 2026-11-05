import { OfferSummary } from '@/components/domain/OfferSummary'
import { Section } from '@/components/ui/Section'
import type { TransactionDetail } from '@/lib/api/types/transactions'
import { canAccess } from '@/lib/permissions/permissions'
import { formatWAT } from '@/lib/time/time'
import { useSessionStore } from '@/stores/session'

/** The agreement frozen at acceptance; later listing edits never change it (QA-08). */
export function SnapshotSection({ tx }: { tx: TransactionDetail }) {
  // Item records are for moderators and administrators
  const canBrowse = canAccess(
    'records',
    useSessionStore((s) => s.roles),
  )
  return (
    <Section title="Agreement snapshot">
      <p className="text-compact text-muted">Agreement at acceptance · read-only</p>
      <p className="text-compact text-muted tabular-nums">Accepted {formatWAT(tx.acceptedAt)}</p>
      <OfferSummary terms={tx.snapshot} itemHref={canBrowse ? (id) => `/records/items/${id}` : undefined} />
    </Section>
  )
}
