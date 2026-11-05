import { Link } from 'react-router'
import { OfferSummary } from '@/components/domain/OfferSummary'
import { TransactionStatusBadge } from '@/components/domain/TransactionStatusBadge'
import { Section } from '@/components/ui/Section'
import type { CaseDetail } from '@/lib/api/types/cases'
import { confirmationCount, TRANSACTION_FLAG } from '@/lib/copy/status'

/** The trade behind the case, linked through the case so other staff may open it (design §9a.2). */
export function LinkedTransactionSection({ caseDetail }: { caseDetail: CaseDetail }) {
  const tx = caseDetail.transactionSummary
  if (!tx) return null
  // A disputed status already says "Disputed"
  const flags = tx.flags.filter((f) => !(f === 'DISPUTED' && tx.status === 'DISPUTED'))

  return (
    <Section title="Linked transaction">
      <p className="flex flex-wrap items-center gap-2">
        <Link
          to={`/transactions/${tx.id}?case=${caseDetail.id}`}
          className="font-semibold text-action tabular-nums underline underline-offset-2"
        >
          Transaction {tx.id}
        </Link>
        <TransactionStatusBadge status={tx.status} />
        <span className="text-compact text-muted">{confirmationCount(tx.confirmations)}</span>
      </p>
      {flags.length > 0 && (
        <p className="text-compact text-warning">{flags.map((f) => TRANSACTION_FLAG[f].label).join(' · ')}</p>
      )}
      <OfferSummary terms={tx.terms} mode="compact" />
    </Section>
  )
}
