import { useQuery } from '@tanstack/react-query'
import { getCase } from '@/features/cases/api/case-api'
import { caseQueryKey } from '@/lib/api/reference'

export function useCase(id: string) {
  return useQuery({ queryKey: caseQueryKey(id), queryFn: ({ signal }) => getCase(id, { signal }) })
}
