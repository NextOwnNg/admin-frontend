import { keepPreviousData, useQuery } from '@tanstack/react-query'
import type { AuditLogFilters } from '@/features/audit/schemas'
import { apiClient } from '@/lib/api/client'
import type { AuditPage } from '@/lib/api/types/audit'

export function useAuditLog(filters: AuditLogFilters) {
  return useQuery({
    queryKey: ['admin', 'audit', filters],
    queryFn: async ({ signal }) => (await apiClient.get<AuditPage>('/admin/audit', { params: filters, signal })).data,
    placeholderData: keepPreviousData,
  })
}
