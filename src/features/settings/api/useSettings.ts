import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api/client'
import { idempotencyHeaders } from '@/lib/api/idempotency'
import type {
  PilotSettings,
  SettingsSection,
  SettingsUpdateBody,
  SettingsUpdateResult,
  SettingsVersion,
} from '@/lib/api/types/settings'

export const settingsQueryKey = ['admin', 'settings'] as const
export const settingsHistoryQueryKey = ['admin', 'settings-history'] as const

export const getSettings = async ({ signal }: { signal?: AbortSignal } = {}) =>
  (await apiClient.get<PilotSettings>('/admin/settings', { signal })).data

/** The pilot settings; every staff member may read them (record filters use areas and categories) */
export function useSettings() {
  return useQuery({ queryKey: settingsQueryKey, queryFn: getSettings })
}

/** Every saved version, newest first (administrators) */
export function useSettingsHistory() {
  return useQuery({
    queryKey: settingsHistoryQueryKey,
    queryFn: async ({ signal }) =>
      (await apiClient.get<{ items: SettingsVersion[] }>('/admin/settings/history', { signal })).data.items,
  })
}

export type UpdateSettingsInput = SettingsUpdateBody & { section: SettingsSection; idempotencyKey: string }

/** `PUT /admin/settings/:section`. Never retried: an uncertain outcome is read back first (PRD §3.3). */
export function useUpdateSettings() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ section, idempotencyKey, ...body }: UpdateSettingsInput) =>
      (
        await apiClient.put<SettingsUpdateResult>(`/admin/settings/${section}`, body, {
          headers: idempotencyHeaders(idempotencyKey),
        })
      ).data,
    onSettled: () =>
      Promise.all(
        [settingsQueryKey, settingsHistoryQueryKey, ['admin', 'audit']].map((queryKey) =>
          queryClient.invalidateQueries({ queryKey }),
        ),
      ),
  })
}
