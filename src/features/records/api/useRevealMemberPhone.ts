import { useMutation, useQueryClient } from '@tanstack/react-query'
import { recordQueryKey, revealMemberPhone } from '@/features/records/api/records-api'
import { newIdempotencyKey } from '@/lib/api/idempotency'

/**
 * Reveals a member's phone with a reason (PRD §7, ADM-T-02). Like `useReveal`, the number is only returned,
 * never cached; the member refetches to show the logged view.
 */
export function useRevealMemberPhone(id: string) {
  const queryClient = useQueryClient()
  const mutation = useMutation({
    gcTime: 0,
    mutationFn: (reason: string) => revealMemberPhone(id, reason, newIdempotencyKey()),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: recordQueryKey('users', id) }),
  })
  return async (reason: string) => (await mutation.mutateAsync(reason)).value
}
