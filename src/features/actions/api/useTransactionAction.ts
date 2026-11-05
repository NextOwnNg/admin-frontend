import { useMutation, useQueryClient } from '@tanstack/react-query'
import { invalidateAfterAction } from '@/features/actions/api/useCaseAction'
import { transactionQueryKey } from '@/features/transactions/api/transaction-api'
import { apiClient } from '@/lib/api/client'
import { idempotencyHeaders } from '@/lib/api/idempotency'
import { caseQueryKey } from '@/lib/api/reference'
import type { ReleaseBody, ResolutionBody, TransactionActionResult } from '@/lib/api/types/transactions'

export type TransactionActionInput =
  | { kind: 'resolve'; body: ResolutionBody; idempotencyKey: string }
  | { kind: 'release'; body: ReleaseBody; idempotencyKey: string }

/** Resolve a transaction or release an item (ADM-FE-06), administrators only. Never retried. */
export function useTransactionAction(transactionId: string, caseId?: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ kind, body, idempotencyKey }: TransactionActionInput) =>
      (
        await apiClient.post<TransactionActionResult>(
          `/admin/transactions/${transactionId}/${kind === 'resolve' ? 'resolution' : 'release'}`,
          body,
          { params: caseId ? { caseId } : undefined, headers: idempotencyHeaders(idempotencyKey) },
        )
      ).data,
    onSettled: (result) =>
      invalidateAfterAction(queryClient, [
        transactionQueryKey(transactionId),
        ...(result?.transaction.caseIds ?? []).map(caseQueryKey),
      ]),
  })
}
