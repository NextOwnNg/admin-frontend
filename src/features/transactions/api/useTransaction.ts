import { useQuery } from '@tanstack/react-query'
import { getTransaction, transactionQueryKey } from '@/features/transactions/api/transaction-api'

/** A transaction, read through its case for non-administrators (design §9a.2) */
export function useTransaction(id: string, caseId?: string) {
  return useQuery({
    queryKey: transactionQueryKey(id, caseId),
    queryFn: ({ signal }) => getTransaction(id, caseId, { signal }),
  })
}
