import { apiClient } from '@/lib/api/client'
import { idempotencyHeaders } from '@/lib/api/idempotency'
import type { CaseDetail, RevealBody, RevealResult } from '@/lib/api/types/cases'

/** Typed case endpoints (design §6). Only the hooks in this folder call them. */

export async function getCase(id: string, { signal }: { signal?: AbortSignal } = {}) {
  return (await apiClient.get<CaseDetail>(`/admin/cases/${id}`, { signal })).data
}

export async function addNote(id: string, body: string, idempotencyKey: string) {
  return (
    await apiClient.post<CaseDetail>(
      `/admin/cases/${id}/notes`,
      { body },
      { headers: idempotencyHeaders(idempotencyKey) },
    )
  ).data
}

export type RevealScope = { kind: 'case'; id: string } | { kind: 'transaction'; id: string; caseId?: string }

export async function reveal(scope: RevealScope, body: RevealBody, idempotencyKey: string) {
  const url = scope.kind === 'case' ? `/admin/cases/${scope.id}/reveal` : `/admin/transactions/${scope.id}/reveal`
  const params = scope.kind === 'transaction' && scope.caseId ? { caseId: scope.caseId } : undefined
  return (await apiClient.post<RevealResult>(url, body, { params, headers: idempotencyHeaders(idempotencyKey) })).data
}
