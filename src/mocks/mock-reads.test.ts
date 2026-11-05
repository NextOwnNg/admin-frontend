import { describe, expect, it } from 'vitest'
import { apiClient } from '@/lib/api/client'
import type { ApiError } from '@/lib/api/api-error'
import type { AuditPage } from '@/lib/api/types/audit'
import type { CaseDetail, CasePage } from '@/lib/api/types/cases'
import type { Overview, ReasonCode, StaffMember } from '@/lib/api/types/reference'
import type { TransactionDetail } from '@/lib/api/types/transactions'
import { SEVERITIES } from '@/lib/copy/status'
import { SCENARIO, TX } from '@/mocks/seed'
import { signInAs } from '@/test/auth'

const cases = async (query = '') => (await apiClient.get<CasePage>(`/admin/cases${query}`)).data
const status = (request: Promise<unknown>) =>
  request.then(
    () => 200,
    (e: ApiError) => e.status,
  )

describe('mock admin API reads (design §6)', () => {
  it('lists S1 first, then by severity and oldest first', async () => {
    await signInAs('moderator')
    const { items } = await cases('?status=open,assigned,awaiting_info,escalated')

    expect(items[0]!.severity).toBe('S1')
    expect(items[0]!.id).toBe(SCENARIO.s1Unassigned)
    expect(items[0]!.reportCount).toBe(3)
    const ranks = items.map((c) => SEVERITIES.indexOf(c.severity))
    expect(ranks).toEqual([...ranks].sort((a, b) => a - b))
    const s3 = items.filter((c) => c.severity === 'S3').map((c) => c.openedAt)
    expect(s3).toEqual([...s3].sort())
  })

  it('keeps S1 pinned when sorted newest first', async () => {
    await signInAs('moderator')
    const { items } = await cases('?sort=-age')
    expect(items[0]!.severity).toBe('S1')
    const rest = items.filter((c) => c.severity !== 'S1').map((c) => c.openedAt)
    expect(rest).toEqual([...rest].sort().reverse())
  })

  it('filters by severity and status', async () => {
    await signInAs('moderator')
    const { items } = await cases('?severity=S3&status=open')
    expect(items.length).toBeGreaterThan(0)
    expect(items.every((c) => c.severity === 'S3' && c.status === 'open')).toBe(true)
  })

  it('ignores values it does not know', async () => {
    await signInAs('moderator')
    expect(await cases('?severity=S9&status=nope&cursor=abc')).toEqual(await cases())
  })

  it('filters unassigned cases', async () => {
    await signInAs('moderator')
    const { items } = await cases('?assignee=unassigned')
    expect(items.length).toBeGreaterThan(0)
    expect(items.every((c) => c.assignee === null)).toBe(true)
  })

  it('pages 25 at a time with a total', async () => {
    await signInAs('moderator')
    const first = await cases()
    expect(first.items).toHaveLength(25)
    expect(first.total).toBeGreaterThan(25)
    const second = await cases(`?cursor=${first.nextCursor}`)
    expect(second.items).toHaveLength(first.total - 25)
    expect(second.nextCursor).toBeNull()
  })

  it('shows a support agent only the cases assigned to them', async () => {
    await signInAs('support_agent')
    const { items } = await cases()
    expect(items.length).toBeGreaterThan(0)
    expect(items.every((c) => c.assignee?.staffId === 's-agent')).toBe(true)
  })

  it('refuses a support agent an unassigned case (QA-16)', async () => {
    await signInAs('support_agent')
    expect(await status(apiClient.get(`/admin/cases/${SCENARIO.s1Unassigned}`))).toBe(403)
    const { data } = await apiClient.get<CaseDetail>(`/admin/cases/${SCENARIO.paymentDispute}`)
    expect(data.transactionSummary?.confirmations).toBe(1)
  })

  it('answers not found for an unknown case', async () => {
    await signInAs('moderator')
    expect(await status(apiClient.get('/admin/cases/NX-999999'))).toBe(404)
  })

  it('keeps the moderation log for administrators', async () => {
    await signInAs('moderator')
    expect(await status(apiClient.get('/admin/audit'))).toBe(403)
  })

  it('lists the moderation log newest first for administrators', async () => {
    await signInAs('administrator')
    const { data } = await apiClient.get<AuditPage>('/admin/audit?targetType=case')
    expect(data.items.length).toBeGreaterThan(0)
    expect(data.items.every((e) => e.target.type === 'case')).toBe(true)
    const times = data.items.map((e) => e.at)
    expect(times).toEqual([...times].sort().reverse())
  })

  it('opens a transaction for other staff only through a case they may see (design §9a.2)', async () => {
    await signInAs('support_agent')
    expect(await status(apiClient.get(`/admin/transactions/${TX.paymentDispute}`))).toBe(403)
    expect(
      await status(apiClient.get(`/admin/transactions/${TX.partialTimeout}?caseId=${SCENARIO.partialTimeout}`)),
    ).toBe(403)
    const { data } = await apiClient.get<TransactionDetail>(
      `/admin/transactions/${TX.paymentDispute}?caseId=${SCENARIO.paymentDispute}`,
    )
    expect(data.confirmationEvents).toHaveLength(2)
  })

  it('serves draft reason codes of both kinds', async () => {
    await signInAs('moderator')
    const { data } = await apiClient.get<ReasonCode[]>('/admin/reason-codes')
    expect(data.find((r) => r.code === 'PROHIBITED')).toMatchObject({ kind: 'violation', severity: 'S3' })
    expect(data.find((r) => r.code === 'PROHIBITED')!.appliesTo).toContain('listing')
    expect(data.find((r) => r.code === 'BOTH_CONFIRMED')).toMatchObject({ kind: 'decision' })
  })

  it('lists active staff', async () => {
    await signInAs('moderator')
    const { data } = await apiClient.get<StaffMember[]>('/admin/staff')
    expect(data.map((s) => s.displayName)).toContain('Tunde Bakare')
  })

  it('scopes the overview to a support agent’s cases', async () => {
    await signInAs('support_agent')
    const { data } = await apiClient.get<Overview>('/admin/overview')
    expect(data.myCases.length).toBeGreaterThan(0)
    expect(data.myCases.every((c) => c.assignee?.staffId === 's-agent')).toBe(true)
    expect(data.openBySeverity.S1).toBe(0)
  })

  it('asks for sign-in without a session', async () => {
    expect(await status(apiClient.get('/admin/cases'))).toBe(401)
  })
})
