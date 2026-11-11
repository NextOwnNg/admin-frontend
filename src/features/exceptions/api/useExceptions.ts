import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api/client'
import type { ExceptionPage, ExceptionQueue } from '@/lib/api/types/exceptions'

export const exceptionsQueryKey = ['admin', 'exceptions'] as const

/** One queue's page, refreshed every minute while it is the one on screen, like the reports queue */
export function useExceptions(
  queue: ExceptionQueue,
  cursor?: string,
  { enabled = true, poll = true }: { enabled?: boolean; poll?: boolean } = {},
) {
  return useQuery({
    enabled,
    queryKey: [...exceptionsQueryKey, queue, cursor ?? null],
    queryFn: async ({ signal }) =>
      (await apiClient.get<ExceptionPage>('/admin/exceptions', { params: { queue, cursor }, signal })).data,
    refetchInterval: poll ? 60_000 : false,
    placeholderData: keepPreviousData,
  })
}
