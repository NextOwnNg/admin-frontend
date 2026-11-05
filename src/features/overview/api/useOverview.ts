import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api/client'
import type { Overview } from '@/lib/api/types/reference'

export function useOverview() {
  return useQuery({
    queryKey: ['admin', 'overview'],
    queryFn: async ({ signal }) => (await apiClient.get<Overview>('/admin/overview', { signal })).data,
    refetchInterval: 60_000,
  })
}
