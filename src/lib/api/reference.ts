import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api/client'
import { idempotencyHeaders, newIdempotencyKey } from '@/lib/api/idempotency'
import type { CaseDetail } from '@/lib/api/types/cases'
import type { ReasonCode, StaffMember } from '@/lib/api/types/reference'

/** Reference data and assignment, shared by the queue, the case page and the action dialogs. */

const REFERENCE_STALE_MS = 10 * 60_000

export const staffQueryKey = ['admin', 'staff'] as const
export const reasonCodesQueryKey = ['admin', 'reason-codes'] as const
export const caseQueryKey = (id: string) => ['admin', 'case', id] as const
export const casesQueryKey = ['admin', 'cases'] as const

export function useStaff() {
  return useQuery({
    queryKey: staffQueryKey,
    queryFn: async ({ signal }) => (await apiClient.get<StaffMember[]>('/admin/staff', { signal })).data,
    staleTime: REFERENCE_STALE_MS,
  })
}

export function useReasonCodes() {
  return useQuery({
    queryKey: reasonCodesQueryKey,
    queryFn: async ({ signal }) => (await apiClient.get<ReasonCode[]>('/admin/reason-codes', { signal })).data,
    staleTime: REFERENCE_STALE_MS,
  })
}

/** The reason code's label once reason codes have loaded; the code itself until then */
export function useReasonLabel(code: string | null) {
  const reasons = useReasonCodes()
  return code ? (reasons.data?.find((r) => r.code === code)?.label ?? code) : null
}

/** "Threats or harassment (S1)"; decision codes have no severity */
export const reasonCodeLabel = (code: ReasonCode) => (code.severity ? `${code.label} (${code.severity})` : code.label)

export type AssignVariables = { caseId: string; assigneeId: string | null; expectedVersion: number }

/**
 * Assign, take over or unassign a case (design §9a.5). Not a sanction, so no reason code, but versioned:
 * a 409 means someone else changed it, and the refetch shows what they did.
 */
export function useAssignCase() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ caseId, ...body }: AssignVariables) =>
      (
        await apiClient.post<CaseDetail>(`/admin/cases/${caseId}/assign`, body, {
          headers: idempotencyHeaders(newIdempotencyKey()),
        })
      ).data,
    onSettled: (_data, _error, { caseId }) =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: casesQueryKey }),
        queryClient.invalidateQueries({ queryKey: caseQueryKey(caseId) }),
        queryClient.invalidateQueries({ queryKey: ['admin', 'overview'] }),
      ]),
  })
}
