import { describe, expect, it } from 'vitest'
import type { ApiError } from '@/lib/api/api-error'
import { apiClient } from '@/lib/api/client'
import { idempotencyHeaders, newIdempotencyKey } from '@/lib/api/idempotency'
import type { AuditPage } from '@/lib/api/types/audit'
import type { PilotSettings, SettingsUpdateResult, SettingsVersion } from '@/lib/api/types/settings'
import type { TransactionDetail } from '@/lib/api/types/transactions'
import { TX } from '@/mocks/seed'
import { signInAs } from '@/test/auth'

const REASON = 'Pilot feedback on offer timing'
const status = (request: Promise<unknown>) =>
  request.then(
    () => 200,
    (e: ApiError) => e.status,
  )
const settings = async () => (await apiClient.get<PilotSettings>('/admin/settings')).data
const put = (section: string, value: unknown, expectedVersion: number, key = newIdempotencyKey(), reason = REASON) =>
  apiClient.put<SettingsUpdateResult>(
    `/admin/settings/${section}`,
    { value, reason, expectedVersion },
    { headers: idempotencyHeaders(key) },
  )

describe('mock settings (Phase C design §4.5, ADM-FE-09)', () => {
  it('lets all staff read settings but only administrators change them or see history', async () => {
    await signInAs('moderator')
    const s = await settings()
    expect(s.offerLifetimeHours).toBe(72)
    expect(await status(put('offerLifetimeHours', 96, s.version))).toBe(403)
    expect(await status(apiClient.get('/admin/settings/history'))).toBe(403)
  })

  it('saves a change as a new version with history and an audit entry', async () => {
    await signInAs('administrator')
    const before = await settings()
    const { data } = await put('offerLifetimeHours', 96, before.version)
    expect(data.settings).toMatchObject({ version: before.version + 1, offerLifetimeHours: 96 })
    expect(data.auditEntry).toMatchObject({ action: 'update_settings', note: REASON })

    const history = (await apiClient.get<{ items: SettingsVersion[] }>('/admin/settings/history')).data.items
    expect(history[0]).toMatchObject({
      version: before.version + 1,
      section: 'offerLifetimeHours',
      before: 72,
      after: 96,
    })
    const log = (await apiClient.get<AuditPage>('/admin/audit', { params: { targetType: 'settings' } })).data
    expect(log.items[0]).toMatchObject({
      action: 'update_settings',
      target: { type: 'settings', id: 'offerLifetimeHours' },
    })
  })

  it('refuses a stale version, a short reason, an unknown section and an invalid value', async () => {
    await signInAs('administrator')
    const s = await settings()
    expect(await status(put('offerLifetimeHours', 96, s.version - 1))).toBe(409)
    expect(await status(put('offerLifetimeHours', 96, s.version, newIdempotencyKey(), 'short'))).toBe(422)
    expect(await status(put('colour', 'blue', s.version))).toBe(404)
    const invalid = await put('offerLifetimeHours', 200, s.version).catch((e: ApiError) => e)
    expect((invalid as ApiError).fieldErrors).toEqual({ value: 'Enter a whole number of hours from 24 to 168.' })
  })

  it('replays a repeated key without a second version', async () => {
    await signInAs('administrator')
    const s = await settings()
    const key = newIdempotencyKey()
    await put('reservationDays', 5, s.version, key)
    const again = await put('reservationDays', 5, s.version, key)
    expect(again.data.settings.version).toBe(s.version + 1)
    expect((await settings()).version).toBe(s.version + 1)
  })

  it('keeps places in use: they can be made inactive, never removed', async () => {
    await signInAs('administrator')
    const s = await settings()
    const lagos = s.locations[0]!
    const withoutYaba = [{ ...lagos, areas: lagos.areas.filter((a) => a.name !== 'Yaba') }]
    const refused = await put('locations', withoutYaba, s.version).catch((e: ApiError) => e)
    expect((refused as ApiError).status).toBe(422)
    expect(Object.values((refused as ApiError).fieldErrors ?? {})).toContain(
      'Yaba is in use. Make it inactive instead.',
    )

    const withoutOjota = [{ ...lagos, areas: lagos.areas.filter((a) => a.name !== 'Ojota') }]
    expect(await status(put('locations', withoutOjota, s.version))).toBe(200)
  })

  it('never changes an agreement already made', async () => {
    await signInAs('administrator')
    const tx = async () => (await apiClient.get<TransactionDetail>(`/admin/transactions/${TX.paymentDispute}`)).data
    const before = await tx()
    const s = await settings()
    await put('offerLifetimeHours', 24, s.version)
    await put('reservationDays', 1, s.version + 1)
    const after = await tx()
    expect(after.snapshot).toEqual(before.snapshot)
    expect(after.reservations).toEqual(before.reservations)
  })
})
