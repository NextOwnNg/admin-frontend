import { useMutation, useQueryClient, type QueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api/client'
import { idempotencyHeaders } from '@/lib/api/idempotency'
import { caseQueryKey, casesQueryKey } from '@/lib/api/reference'
import type { CaseActionBody, CaseActionResult } from '@/lib/api/types/cases'

/** Everything an action can change: the record, its lists, the overview and the log */
export function invalidateAfterAction(queryClient: QueryClient, keys: readonly (readonly unknown[])[]) {
  return Promise.all(
    [...keys, casesQueryKey, ['admin', 'overview'], ['admin', 'audit']].map((queryKey) =>
      queryClient.invalidateQueries({ queryKey }),
    ),
  )
}

/** `POST /admin/cases/:id/actions`. Never retried: an uncertain outcome is read back first (design §5.6). */
export function useCaseAction(caseId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ body, idempotencyKey }: { body: CaseActionBody; idempotencyKey: string }) =>
      (
        await apiClient.post<CaseActionResult>(`/admin/cases/${caseId}/actions`, body, {
          headers: idempotencyHeaders(idempotencyKey),
        })
      ).data,
    onSettled: (result) =>
      invalidateAfterAction(queryClient, [
        caseQueryKey(caseId),
        ...(result?.case.transactionId ? [['admin', 'transaction', result.case.transactionId]] : []),
      ]),
  })
}
