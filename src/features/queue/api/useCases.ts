import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { getCases } from '@/features/queue/api/queue-api'
import { casesQueryKey } from '@/lib/api/reference'
import type { CaseFilters } from '@/lib/api/types/cases'

/** The queue page, refreshed every minute while visible (design §4.2) */
export function useCases(filters: CaseFilters) {
  return useQuery({
    queryKey: [...casesQueryKey, filters],
    queryFn: ({ signal }) => getCases(filters, { signal }),
    refetchInterval: 60_000,
    placeholderData: keepPreviousData,
  })
}
