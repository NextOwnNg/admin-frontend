import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api/client'
import type { DashboardData, DashboardQuery } from '@/lib/api/types/dashboard'

/** The dashboard figures for one filter set; `null` holds the request (an invalid range). Read once, never polled. */
export function useDashboard(query: DashboardQuery | null) {
  return useQuery({
    queryKey: ['admin', 'dashboard', query],
    queryFn: async ({ signal }) =>
      (await apiClient.get<DashboardData>('/admin/dashboard', { params: query, signal })).data,
    enabled: query !== null,
    placeholderData: keepPreviousData,
    refetchOnWindowFocus: false,
  })
}
