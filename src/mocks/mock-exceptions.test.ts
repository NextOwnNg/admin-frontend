import { describe, expect, it } from 'vitest'
import type { ApiError } from '@/lib/api/api-error'
import { apiClient } from '@/lib/api/client'
import { idempotencyHeaders, newIdempotencyKey } from '@/lib/api/idempotency'
import type { CaseDetail } from '@/lib/api/types/cases'
import type { ExceptionPage, ExceptionQueue } from '@/lib/api/types/exceptions'
import type { MemberDetail } from '@/lib/api/types/records'
import { SEVERITIES } from '@/lib/copy/status'
import { REC } from '@/mocks/records-seed'
import { SCENARIO } from '@/mocks/seed'
import { signInAs } from '@/test/auth'

const QUEUES: ExceptionQueue[] = ['partial_confirmation', 'reservation_expiry', 'duplicate', 'dispute', 'appeal']
const status = (request: Promise<unknown>) =>
  request.then(
    () => 200,
    (e: ApiError) => e.status,
  )
const queue = async (q: ExceptionQueue) =>
  (await apiClient.get<ExceptionPage>('/admin/exceptions', { params: { queue: q } })).data

async function act(caseId: string, body: Record<string, unknown>) {
  const { data } = await apiClient.get<CaseDetail>(`/admin/cases/${caseId}`)
  return apiClient.post(
    `/admin/cases/${caseId}/actions`,
    { ...body, expectedVersion: data.version },
    { headers: idempotencyHeaders(newIdempotencyKey()) },
  )
}

describe('mock exception queues (Phase C design §4.4, ADM-FE-08)', () => {
  it('refuses moderators and unknown queues', async () => {
    await signInAs('moderator')
    expect(await status(apiClient.get('/admin/exceptions'))).toBe(403)
    await signInAs('administrator')
    expect(await status(apiClient.get('/admin/exceptions', { params: { queue: 'nope' } }))).toBe(422)
  })

  it('fills every queue, and gives every row a next action', async () => {
    await signInAs('administrator')
    for (const q of QUEUES) {
      const { items } = await queue(q)
      expect(items.length, q).toBeGreaterThan(0)
      expect(
        items.some((r) => r.assignee === null),
        `${q} has an unassigned row`,
      ).toBe(true)
      for (const row of items) {
        expect(row.nextAction.label, row.caseId).not.toBe('')
        expect(row.nextAction.href, row.caseId).toMatch(/^\/(cases|transactions)\//)
      }
    }
  })

  it('lists the disputed transaction under open disputes (QA-13)', async () => {
    await signInAs('administrator')
    const { items } = await queue('dispute')
    const row = items.find((r) => r.caseId === SCENARIO.paymentDispute)!
    expect(row.nextAction).toMatchObject({ label: 'Resolve dispute' })
    expect(row.nextAction.href).toBe(`/transactions/T-000301?case=${SCENARIO.paymentDispute}`)
  })

  it('says an expiring reservation needs nothing yet, and when', async () => {
    await signInAs('administrator')
    const row = (await queue('reservation_expiry')).items.find((r) => r.caseId === SCENARIO.expiringReservation)!
    expect(row.nextAction.label).toBe('Open transaction')
    expect(row.nextAction.note).toMatch(/^Due to expire\. No action needed before /)
  })

  it('puts overdue first, then priority, then due time', async () => {
    await signInAs('administrator')
    for (const q of QUEUES) {
      const { items } = await queue(q)
      const keys = items.map((r) => [Number(!r.overdue), SEVERITIES.indexOf(r.priority), r.dueAt] as const)
      const sorted = [...keys].sort((a, b) => a[0] - b[0] || a[1] - b[1] || a[2].localeCompare(b[2]))
      expect(keys, q).toEqual(sorted)
    }
    const all = await Promise.all(QUEUES.map(queue))
    expect(all.some((p) => p.items.some((r) => r.overdue))).toBe(true)
  })

  it('counts every queue, and a closed case leaves its queue', async () => {
    await signInAs('administrator')
    const before = await queue('appeal')
    for (const q of QUEUES) expect(before.counts[q]).toBe((await queue(q)).total)

    await act(SCENARIO.appeal, {
      action: 'close',
      target: { type: 'case', id: SCENARIO.appeal },
      outcome: 'upheld',
      reasonCode: 'RESTRICTION_UPHELD',
    })
    const after = await queue('appeal')
    expect(after.items.map((r) => r.caseId)).not.toContain(SCENARIO.appeal)
    expect(after.counts.appeal).toBe(before.counts.appeal - 1)
  })

  it('lifts and sets restrictions on the member record', async () => {
    await signInAs('moderator')
    const member = async () => (await apiClient.get<MemberDetail>(`/admin/records/users/${REC.restrictedMember}`)).data
    expect((await member()).status).toBe('restricted')
    await act(SCENARIO.appeal, {
      action: 'lift_restriction',
      target: { type: 'account', id: REC.restrictedMember },
      reasonCode: 'EVIDENCE_REVIEWED',
    })
    expect((await member()).status).toBe('active')
    await act(SCENARIO.appeal, {
      action: 'restrict',
      target: { type: 'account', id: REC.restrictedMember },
      reasonCode: 'ABUSE',
      durationDays: 7,
    })
    const restricted = await member()
    expect(restricted.status).toBe('restricted')
    expect(Date.parse(restricted.restrictedUntil!)).toBeGreaterThan(Date.now() + 6 * 86_400_000)
  })

  it('describes appeals and duplicates on their cases', async () => {
    await signInAs('moderator')
    const appeal = (await apiClient.get<CaseDetail>(`/admin/cases/${SCENARIO.appeal}`)).data
    expect(appeal.kind).toBe('appeal')
    expect(appeal.appeal?.statement).toBeTruthy()
    expect(appeal.parties.map((p) => p.role)).toEqual(['appellant'])
    const duplicate = (await apiClient.get<CaseDetail>(`/admin/cases/${SCENARIO.duplicate}`)).data
    expect(duplicate.kind).toBe('duplicate')
    expect(duplicate.duplicateOf).toMatchObject({ kind: 'listings', id: REC.duplicateListing })
  })
})

describe('support agents taking exceptions (Phase C design §9 call 3)', () => {
  const assign = (caseId: string, assigneeId: string, expectedVersion: number) =>
    apiClient.post(
      `/admin/cases/${caseId}/assign`,
      { assigneeId, expectedVersion },
      { headers: idempotencyHeaders(newIdempotencyKey()) },
    )
  const version = async (caseId: string) => {
    await signInAs('administrator')
    const v = (await apiClient.get<CaseDetail>(`/admin/cases/${caseId}`)).data.version
    await signInAs('support_agent')
    return v
  }

  it('lets an agent take an exception for themselves, and nothing more', async () => {
    const v = await version(SCENARIO.appeal)
    expect(await status(assign(SCENARIO.appeal, 's-agent-2', v))).toBe(403)
    expect(await status(assign(SCENARIO.appeal, 's-agent', v))).toBe(200)
    // Once someone else has it, an agent can't take it over (final review)
    await signInAs('administrator')
    const mine = (await apiClient.get<CaseDetail>(`/admin/cases/${SCENARIO.appeal}`)).data.version
    await assign(SCENARIO.appeal, 's-mod', mine)
    const held = (await apiClient.get<CaseDetail>(`/admin/cases/${SCENARIO.appeal}`)).data.version
    await signInAs('support_agent')
    expect(await status(assign(SCENARIO.appeal, 's-agent', held))).toBe(403)
    // An ordinary report is not theirs to take
    const other = await version(SCENARIO.s1Unassigned)
    expect(await status(assign(SCENARIO.s1Unassigned, 's-agent', other))).toBe(403)
  })
})
