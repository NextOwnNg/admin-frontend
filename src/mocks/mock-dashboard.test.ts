import { describe, expect, it } from 'vitest'
import type { ApiError } from '@/lib/api/api-error'
import { apiClient } from '@/lib/api/client'
import type { DashboardData, DashboardQuery } from '@/lib/api/types/dashboard'
import { addDays, watToday } from '@/lib/time/time'
import { PILOT_START } from '@/mocks/db/dashboard'
import { signInAs } from '@/test/auth'

const MODES = ['CASH', 'SWAP', 'SWAP_PLUS_CASH'] as const
const get = async (params: DashboardQuery) => (await apiClient.get<DashboardData>('/admin/dashboard', { params })).data
const failure = (request: Promise<unknown>) =>
  request.then(
    () => null,
    (e: ApiError) => e,
  )
const today = () => watToday(Date.now())
const pilot = () => ({ from: PILOT_START, to: today() })

describe('mock dashboard (ADM-FE-10, Phase D design §4.4)', () => {
  it('keeps the dashboard for administrators', async () => {
    await signInAs('moderator')
    expect((await failure(get(pilot())))?.status).toBe(403)
  })

  it('refuses a start after the end with a field error', async () => {
    await signInAs('administrator')
    const order = await failure(get({ from: '2026-11-02', to: '2026-11-01' }))
    expect(order?.status).toBe(422)
    expect(order?.fieldErrors).toHaveProperty('from')
  })

  it('answers the same query with the same figures', async () => {
    await signInAs('administrator')
    const figures = (data: DashboardData) => ({ ...data, dataThrough: 'ignored' })
    expect(figures(await get(pilot()))).toEqual(figures(await get(pilot())))
  })

  it('keeps the funnel narrowing and the all-modes counts equal to the modes added up', async () => {
    await signInAs('administrator')
    const { funnel, acceptance, completion } = await get(pilot())
    expect(funnel.published).toBeGreaterThan(0)
    expect(funnel.receivedOffer).toBeLessThanOrEqual(funnel.published)
    expect(funnel.accepted).toBeLessThanOrEqual(funnel.receivedOffer)
    expect(funnel.completed).toBeLessThanOrEqual(funnel.accepted)
    const sum = (pick: (m: (typeof MODES)[number]) => number) => MODES.reduce((t, m) => t + pick(m), 0)
    expect(acceptance.ALL.accepted).toBe(sum((m) => acceptance[m].accepted))
    expect(acceptance.ALL.decided).toBe(sum((m) => acceptance[m].decided))
    expect(completion.ALL.completed).toBe(sum((m) => completion[m].completed))
    expect(completion.ALL.matureAccepted).toBe(sum((m) => completion[m].matureAccepted))
    expect(acceptance.ALL.accepted).toBe(funnel.accepted)
  })

  it('narrows every count to one category', async () => {
    await signInAs('administrator')
    const all = await get(pilot())
    const phones = await get({ ...pilot(), category: 'k-phones' })
    expect(phones.funnel.published).toBeGreaterThan(0)
    expect(phones.funnel.published).toBeLessThan(all.funnel.published)
    expect(phones.trust.accepted).toBeLessThanOrEqual(all.trust.accepted)
    expect(phones.support.opened).toBeLessThanOrEqual(all.support.opened)
    expect(phones.liquidity.byCategory.map((r) => r.name)).toEqual(['Phones'])
  })

  it('clamps the range to the pilot start and to today', async () => {
    await signInAs('administrator')
    const { range } = await get({ from: '2026-09-01', to: addDays(today(), 1) })
    expect(range).toEqual({ from: PILOT_START, to: today() })
    const open = await get({ to: today() })
    expect(open.range.from).toBe(PILOT_START)
  })

  it('counts nothing for a range wholly before the pilot or in the future (final review)', async () => {
    await signInAs('administrator')
    const before = await get({ from: '2026-09-01', to: '2026-09-15' })
    expect(before.funnel.published).toBe(0)
    expect(before.range).toEqual({ from: '2026-09-01', to: '2026-09-15' })
    const later = await get({ from: addDays(today(), 10), to: addDays(today(), 20) })
    expect(later.funnel.published).toBe(0)
    expect(later.support.opened).toBe(0)
  })

  it('times completion over every completed deal, even before any is mature (final review)', async () => {
    await signInAs('administrator')
    const { funnel, completion } = await get({ from: addDays(today(), -6), to: today() })
    expect(funnel.completed).toBeGreaterThan(0)
    expect(completion.ALL.medianHours).not.toBeNull()
  })

  it('refuses a date that does not exist (final review)', async () => {
    await signInAs('administrator')
    const bad = await failure(get({ from: '2026-10-45', to: today() }))
    expect(bad?.status).toBe(422)
    expect(bad?.fieldErrors).toHaveProperty('from')
  })

  it('clamps a long range that starts before the pilot instead of refusing it (D1 review)', async () => {
    await signInAs('administrator')
    const { range } = await get({ from: '2025-01-01', to: today() })
    expect(range.from).toBe(PILOT_START)
  })

  it('lists every week of the range, with zeros, and no support week outside it (Review Focus 5)', async () => {
    await signInAs('administrator')
    const from = addDays(today(), -27)
    const { trust, support, range } = await get({ from, to: today(), category: 'k-bikes', area: 'a-ajah' })
    const mondays = (list: { weekStart: string }[]) => list.map((w) => w.weekStart)
    const expected: string[] = []
    const monday = (day: string) => addDays(day, -((new Date(`${day}T00:00:00Z`).getUTCDay() + 6) % 7))
    for (let w = monday(range.from); w <= range.to; w = addDays(w, 7)) expected.push(w)
    expect(mondays(trust.weekly)).toEqual(expected)
    expect(mondays(support.weekly)).toEqual(expected)
  })

  it('has no 7-day liquidity for listings published today', async () => {
    await signInAs('administrator')
    const { liquidity } = await get({ from: today(), to: today() })
    for (const row of [...liquidity.byCategory, ...liquidity.byArea]) expect(row.d7).toBeNull()
  })

  it('says support minutes and cost per deal are not measured, and why', async () => {
    await signInAs('administrator')
    const { support } = await get(pilot())
    expect(support.minutesPerCompleted).toEqual({
      value: null,
      reason: 'Needs time tracking from the operations team.',
    })
    expect(support.costPerCompleted).toEqual({
      value: null,
      reason: 'Needs variable operating cost inputs from the operations team.',
    })
  })
})
