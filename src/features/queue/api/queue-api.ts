import { apiClient } from '@/lib/api/client'
import type { CaseFilters, CasePage } from '@/lib/api/types/cases'

/** `GET /admin/cases`: lists go comma-separated; empty filters are left out. */
export async function getCases(filters: CaseFilters, { signal }: { signal?: AbortSignal } = {}) {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(filters)) {
    const text = Array.isArray(value) ? value.join(',') : (value as string | undefined)
    if (text) params.set(key, text)
  }
  const { data } = await apiClient.get<CasePage>('/admin/cases', { params, signal })
  return data
}
