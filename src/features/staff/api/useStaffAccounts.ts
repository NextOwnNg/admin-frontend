import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api/client'
import { idempotencyHeaders } from '@/lib/api/idempotency'
import { staffQueryKey } from '@/lib/api/reference'
import type { InviteBody, InviteResult, StaffAccountRow } from '@/lib/api/types/staff'

export const staffAccountsQueryKey = ['admin', 'staff', 'members'] as const

/** Staff and pending invites (administrators only) */
export function useStaffAccounts() {
  return useQuery({
    queryKey: staffAccountsQueryKey,
    queryFn: async ({ signal }) => (await apiClient.get<StaffAccountRow[]>('/admin/staff/members', { signal })).data,
  })
}

/** After any change: the table, and the assignment pickers' staff list */
function useRefresh() {
  const queryClient = useQueryClient()
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: staffAccountsQueryKey }),
      queryClient.invalidateQueries({ queryKey: staffQueryKey, exact: true }),
    ])
}

export function useInvite() {
  const refresh = useRefresh()
  return useMutation({
    mutationFn: async ({ body, key }: { body: InviteBody; key: string }) =>
      (await apiClient.post<InviteResult>('/admin/staff/invites', body, { headers: idempotencyHeaders(key) })).data,
    onSuccess: refresh,
  })
}

export function useResendInvite() {
  const refresh = useRefresh()
  return useMutation({
    mutationFn: async ({ inviteId, reason, key }: { inviteId: string; reason: string; key: string }) =>
      (
        await apiClient.post<InviteResult>(
          `/admin/staff/invites/${encodeURIComponent(inviteId)}/resend`,
          { reason },
          { headers: idempotencyHeaders(key) },
        )
      ).data,
    onSuccess: refresh,
  })
}

export function useRevokeInvite() {
  const refresh = useRefresh()
  return useMutation({
    // 204, no body (design 2026-11-21 §5)
    mutationFn: async ({ inviteId, reason, key }: { inviteId: string; reason: string; key: string }) => {
      await apiClient.post(
        `/admin/staff/invites/${encodeURIComponent(inviteId)}/revoke`,
        { reason },
        { headers: idempotencyHeaders(key) },
      )
    },
    onSuccess: refresh,
  })
}
