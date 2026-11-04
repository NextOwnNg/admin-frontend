import { useMutation, useQueryClient } from '@tanstack/react-query'
import { reveal, type RevealScope } from '@/features/cases/api/case-api'
import { newIdempotencyKey } from '@/lib/api/idempotency'
import { caseQueryKey } from '@/lib/api/reference'
import type { RevealBody } from '@/lib/api/types/cases'

/**
 * Reveals masked data or evidence (design §5.7). The result is only returned, never cached: the caller
 * keeps it in component state, so leaving the page masks it again. The record refetches to show the
 * "viewed" audit entry.
 */
export function useReveal() {
  const queryClient = useQueryClient()
  const mutation = useMutation({
    gcTime: 0,
    mutationFn: ({ scope, ...body }: RevealBody & { scope: RevealScope }) => reveal(scope, body, newIdempotencyKey()),
    onSuccess: (_result, { scope }) =>
      queryClient.invalidateQueries({
        queryKey: scope.kind === 'case' ? caseQueryKey(scope.id) : ['admin', 'transaction', scope.id],
      }),
  })
  return mutation.mutateAsync
}
