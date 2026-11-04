import { VersionTimeline } from '@/components/domain/VersionTimeline'
import { Section } from '@/components/ui/Section'
import type { TransactionDetail } from '@/lib/api/types/transactions'

export function VersionsSection({ tx }: { tx: TransactionDetail }) {
  return (
    <Section title="Offer versions">
      <VersionTimeline versions={tx.versions} />
    </Section>
  )
}
