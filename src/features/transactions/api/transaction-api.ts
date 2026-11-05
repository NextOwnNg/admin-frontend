import { apiClient } from '@/lib/api/client'
import type { TransactionDetail } from '@/lib/api/types/transactions'

/** Keyed by the case it was read through: the API may answer differently without it (design §9a.2) */
export const transactionQueryKey = (id: string, caseId?: string) =>
  ['admin', 'transaction', id, caseId ?? null] as const
/** Every cached read of one transaction, whatever case it came through */
export const transactionQueryPrefix = (id: string) => ['admin', 'transaction', id] as const

/** `GET /admin/transactions/:id`; other staff need the case it is linked to (design §9a.2) */
export async function getTransaction(id: string, caseId?: string, { signal }: { signal?: AbortSignal } = {}) {
  const params = caseId ? { caseId } : undefined
  return (await apiClient.get<TransactionDetail>(`/admin/transactions/${id}`, { params, signal })).data
}
