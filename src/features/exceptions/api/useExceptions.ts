import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api/client'
import type { ExceptionPage, ExceptionQueue } from '@/lib/api/types/exceptions'

export const exceptionsQueryKey = ['admin', 'exceptions'] as const

/** One queue's page, refreshed every minute while visible, like the reports queue */
export function useExceptions(queue: ExceptionQueue, cursor?: string) {
  return useQuery({
    queryKey: [...exceptionsQueryKey, queue, cursor ?? null],
    queryFn: async ({ signal }) =>
      (await apiClient.get<ExceptionPage>('/admin/exceptions', { params: { queue, cursor }, signal })).data,
    refetchInterval: 60_000,
    placeholderData: keepPreviousData,
  })
}
