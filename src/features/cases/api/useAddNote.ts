import { useMutation, useQueryClient } from '@tanstack/react-query'
import { addNote } from '@/features/cases/api/case-api'
import { caseQueryKey } from '@/lib/api/reference'

/** Internal staff note (design §4.3): plain text, audited, no version check. */
export function useAddNote(caseId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ body, idempotencyKey }: { body: string; idempotencyKey: string }) =>
      addNote(caseId, body, idempotencyKey),
    onSuccess: (detail) => queryClient.setQueryData(caseQueryKey(caseId), detail),
  })
}
