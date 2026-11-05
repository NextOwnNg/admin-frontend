import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api/client'
import type { SearchResponse } from '@/lib/api/types/search'

export const MIN_SEARCH = 2

/**
 * `GET /admin/search` for one query. Each query has its own cache entry and no placeholder, so a slow answer
 * to an older query can never stand in for the newer one (Phase C design §4.3).
 */
export function useSearch(q: string) {
  const query = q.trim()
  return useQuery({
    queryKey: ['admin', 'search', query],
    queryFn: async ({ signal }) =>
      (await apiClient.get<SearchResponse>('/admin/search', { params: { q: query }, signal })).data,
    enabled: query.length >= MIN_SEARCH,
    staleTime: 30_000,
  })
}
