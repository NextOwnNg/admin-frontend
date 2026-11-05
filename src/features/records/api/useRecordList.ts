import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { getRecordDetail, getRecordList, recordQueryKey, recordsQueryKey } from '@/features/records/api/records-api'
import type { DetailKind, RecordKind } from '@/lib/api/types/records'

/** One page of a record browser */
export function useRecordList<K extends RecordKind>(kind: K, filters: Record<string, unknown>) {
  return useQuery({
    queryKey: recordsQueryKey(kind, filters),
    queryFn: ({ signal }) => getRecordList(kind, filters, { signal }),
    placeholderData: keepPreviousData,
  })
}

/** One record with its links and cases */
export function useRecordDetail<K extends DetailKind>(kind: K, id: string) {
  return useQuery({
    queryKey: recordQueryKey(kind, id),
    queryFn: ({ signal }) => getRecordDetail(kind, id, { signal }),
  })
}
