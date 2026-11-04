import { StatusBadge } from '@/components/ui/StatusBadge'
import { TRANSACTION_STATUS, type TransactionStatus } from '@/lib/copy/status'

export function TransactionStatusBadge({ status }: { status: TransactionStatus }) {
  return <StatusBadge {...TRANSACTION_STATUS[status]} />
}
