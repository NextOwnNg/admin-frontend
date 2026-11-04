import type { TransactionDetail, TransactionSummary } from '@/lib/api/types/transactions'
import type { TransactionRecord } from '@/mocks/seed'
import { auditDb } from '@/mocks/db/audit'
import { reseed, store } from '@/mocks/db/store'

export const transactionsDb = {
  record: (id: string): TransactionRecord | undefined => store().transactions.find((t) => t.id === id),

  detail(id: string): TransactionDetail | undefined {
    const record = transactionsDb.record(id)
    if (!record) return undefined
    const { secrets: _secrets, ...detail } = record
    return structuredClone({ ...detail, history: auditDb.forTransaction(id) })
  },

  summary(id: string): TransactionSummary | null {
    const record = transactionsDb.record(id)
    if (!record) return null
    const { status, flags, confirmations, terms } = record
    return structuredClone({ id, status, flags, confirmations, terms })
  },

  reset: reseed,
}
