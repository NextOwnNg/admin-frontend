import { apiClient } from '@/lib/api/client'
import { idempotencyHeaders } from '@/lib/api/idempotency'
import type {
  DetailKind,
  MemberRevealBody,
  RecordDetailFor,
  RecordKind,
  RecordPage,
  RecordRowFor,
} from '@/lib/api/types/records'

type Opts = { signal?: AbortSignal }

export const recordsQueryKey = (kind: RecordKind, filters: Record<string, unknown>) =>
  ['admin', 'records', kind, filters] as const
export const recordQueryKey = (kind: RecordKind, id: string) => ['admin', 'record', kind, id] as const

/** `GET /admin/records/:kind`: one page of a browser (Phase C design §5) */
export async function getRecordList<K extends RecordKind>(
  kind: K,
  filters: Record<string, unknown>,
  { signal }: Opts = {},
) {
  const params = Object.fromEntries(
    Object.entries(filters).map(([key, value]) => [key, Array.isArray(value) ? value.join(',') : value]),
  )
  return (await apiClient.get<RecordPage<RecordRowFor[K]>>(`/admin/records/${kind}`, { params, signal })).data
}

/** `GET /admin/records/:kind/:id` */
export async function getRecordDetail<K extends DetailKind>(kind: K, id: string, { signal }: Opts = {}) {
  return (await apiClient.get<RecordDetailFor[K]>(`/admin/records/${kind}/${id}`, { signal })).data
}

/** `POST /admin/records/users/:id/reveal`: audited; the number is returned, never cached */
export async function revealMemberPhone(id: string, reason: string, idempotencyKey: string) {
  const body: MemberRevealBody = { field: 'phone', reason }
  return (
    await apiClient.post<{ value: string }>(`/admin/records/users/${id}/reveal`, body, {
      headers: idempotencyHeaders(idempotencyKey),
    })
  ).data
}
