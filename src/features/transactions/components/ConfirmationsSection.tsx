import { ConfirmationEvents } from '@/components/domain/ConfirmationEvents'
import { Section } from '@/components/ui/Section'
import type { TransactionDetail } from '@/lib/api/types/transactions'

export function ConfirmationsSection({ tx }: { tx: TransactionDetail }) {
  return (
    <Section title="Confirmations">
      <ConfirmationEvents events={tx.confirmationEvents} flags={tx.flags} />
    </Section>
  )
}
