import { keepPreviousData, useQuery } from '@tanstack/react-query'
import type { AuditLogFilters } from '@/features/audit/schemas'
import { apiClient } from '@/lib/api/client'
import type { AuditPage } from '@/lib/api/types/audit'
import { watDayEnd, watDayStart } from '@/lib/time/time'

export function useAuditLog(filters: AuditLogFilters) {
  return useQuery({
    queryKey: ['admin', 'audit', filters],
    queryFn: async ({ signal }) => {
      // Operators pick WAT calendar days; the API compares instants
      const params = {
        ...filters,
        from: filters.from && watDayStart(filters.from),
        to: filters.to && watDayEnd(filters.to),
      }
      return (await apiClient.get<AuditPage>('/admin/audit', { params, signal })).data
    },
    placeholderData: keepPreviousData,
  })
}
