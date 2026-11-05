import { describe, expect, it } from 'vitest'
import type { ApiError } from '@/lib/api/api-error'
import { apiClient } from '@/lib/api/client'
import { idempotencyHeaders, newIdempotencyKey } from '@/lib/api/idempotency'
import type { CaseActionBody, CaseActionResult, CaseDetail, RevealResult } from '@/lib/api/types/cases'
import type { TransactionActionResult, TransactionDetail } from '@/lib/api/types/transactions'
import { casesDb } from '@/mocks/db/cases'
import { handlers } from '@/mocks/handlers'
import { SCENARIO, TX } from '@/mocks/seed'
import { signInAs } from '@/test/auth'

const getCase = async (id: string) => (await apiClient.get<CaseDetail>(`/admin/cases/${id}`)).data
const getTx = async (id: string) => (await apiClient.get<TransactionDetail>(`/admin/transactions/${id}`)).data
const post = <T>(url: string, body: unknown, key = newIdempotencyKey()) =>
  apiClient.post<T>(url, body, { headers: idempotencyHeaders(key) })
const failure = (request: Promise<unknown>) =>
  request.then(
    () => {
      throw new Error('expected the request to fail')
    },
    (e: ApiError) => e,
  )

const hideComment = (version: number): CaseActionBody => ({
  action: 'hide',
  target: { type: 'comment', id: 'C-5501' },
  reasonCode: 'ABUSE',
  expectedVersion: version,
})

describe('mock admin API writes (design §4.5, §5.5, §9a)', () => {
  it('records a removal as removed by moderation, not hidden (Phase C1 review)', async () => {
    await signInAs('moderator')
    const before = await getCase(SCENARIO.abusiveComment)
    const { data } = await post<CaseActionResult>(`/admin/cases/${SCENARIO.abusiveComment}/actions`, {
      ...hideComment(before.version),
      action: 'remove',
    })
    expect(data.case.content).toMatchObject({ redaction: 'removed_by_moderation', text: null })
  })

  it('hides reported content with a reason and returns the audit entry (QA-19)', async () => {
    await signInAs('moderator')
    const before = await getCase(SCENARIO.abusiveComment)
    const { data } = await post<CaseActionResult>(
      `/admin/cases/${SCENARIO.abusiveComment}/actions`,
      hideComment(before.version),
    )

    expect(data.auditEntry).toMatchObject({ action: 'hide', actor: 'Tunde Bakare', reasonCode: 'ABUSE' })
    expect(data.case.content).toMatchObject({ redaction: 'hidden_by_moderation', text: null })
    expect(data.case.status).toBe('assigned')
    expect(data.case.history[0]!.id).toBe(data.auditEntry.id)
  })

  it('replays the first answer for a repeated Idempotency-Key, recording once', async () => {
    await signInAs('moderator')
    const { version } = await getCase(SCENARIO.abusiveComment)
    const key = newIdempotencyKey()
    const first = await post<CaseActionResult>(
      `/admin/cases/${SCENARIO.abusiveComment}/actions`,
      hideComment(version),
      key,
    )
    const second = await post<CaseActionResult>(
      `/admin/cases/${SCENARIO.abusiveComment}/actions`,
      hideComment(version),
      key,
    )

    expect(second.data.auditEntry.id).toBe(first.data.auditEntry.id)
    const { history } = await getCase(SCENARIO.abusiveComment)
    expect(history.filter((e) => e.action === 'hide')).toHaveLength(1)
  })

  it('refuses a stale version with a conflict (ADM-T-05)', async () => {
    await signInAs('moderator')
    const { version } = await getCase(SCENARIO.abusiveComment)
    casesDb.bumpVersion(SCENARIO.abusiveComment)
    const error = await failure(post(`/admin/cases/${SCENARIO.abusiveComment}/actions`, hideComment(version)))

    expect(error).toMatchObject({ status: 409, code: 'CONFLICT' })
    expect((await getCase(SCENARIO.abusiveComment)).content?.redaction).toBeNull()
  })

  it('refuses a sanction without a reason code (ADM-T-03)', async () => {
    await signInAs('moderator')
    const { version } = await getCase(SCENARIO.repeatOffender)
    const error = await failure(
      post(`/admin/cases/${SCENARIO.repeatOffender}/actions`, {
        action: 'restrict',
        target: { type: 'account', id: 'u-segun' },
        durationDays: 7,
        expectedVersion: version,
      }),
    )
    expect(error.status).toBe(422)
    expect(error.fieldErrors).toHaveProperty('reasonCode')
  })

  it('refuses a reason code that does not fit the target', async () => {
    await signInAs('moderator')
    const { version } = await getCase(SCENARIO.abusiveComment)
    const error = await failure(
      post(`/admin/cases/${SCENARIO.abusiveComment}/actions`, {
        ...hideComment(version),
        reasonCode: 'BOTH_CONFIRMED',
      }),
    )
    expect(error.fieldErrors).toHaveProperty('reasonCode')
  })

  it('keeps sanctions from support agents', async () => {
    await signInAs('support_agent')
    const { version } = await getCase(SCENARIO.paymentDispute)
    const error = await failure(
      post(`/admin/cases/${SCENARIO.paymentDispute}/actions`, {
        action: 'warn',
        target: { type: 'account', id: 'u-kunle' },
        reasonCode: 'PAYMENT_DISPUTE',
        message: 'Please pay what you agreed.',
        expectedVersion: version,
      }),
    )
    expect(error.status).toBe(403)
  })

  it('moves a case through request information, escalation and closing', async () => {
    await signInAs('moderator')
    const id = SCENARIO.noEvidence
    let current = await getCase(id)
    const act = async (body: Omit<CaseActionBody, 'expectedVersion' | 'target'>) => {
      const { data } = await post<CaseActionResult>(`/admin/cases/${id}/actions`, {
        target: { type: 'case', id },
        ...body,
        expectedVersion: current.version,
      })
      current = data.case
      return data
    }

    await act({ action: 'request_info', message: 'Can you share where you saw this comment?' })
    expect(current.status).toBe('awaiting_info')
    await act({ action: 'escalate', note: 'Needs an administrator: possible coordinated spam.' })
    expect(current.status).toBe('escalated')
    await act({ action: 'close', outcome: 'action_taken', reasonCode: 'SPAM' })
    expect(current).toMatchObject({ status: 'closed', nextAction: null })
    expect(current.decision).toMatchObject({ outcome: 'action_taken', reasonCode: 'SPAM', by: 'Tunde Bakare' })
  })

  it('assigns and unassigns for moderators, never for support agents', async () => {
    await signInAs('moderator')
    const { version } = await getCase(SCENARIO.s1Unassigned)
    const { data } = await post<CaseDetail>(`/admin/cases/${SCENARIO.s1Unassigned}/assign`, {
      assigneeId: 's-mod',
      expectedVersion: version,
    })
    expect(data).toMatchObject({ status: 'assigned', assignee: { displayName: 'Tunde Bakare' } })
    const { data: unassigned } = await post<CaseDetail>(`/admin/cases/${SCENARIO.s1Unassigned}/assign`, {
      assigneeId: null,
      expectedVersion: data.version,
    })
    expect(unassigned).toMatchObject({ status: 'open', assignee: null })

    await signInAs('support_agent')
    // An ordinary report: agents only take exceptions, for themselves (Phase C design §9 call 3)
    const error = await failure(
      post(`/admin/cases/${SCENARIO.s1Unassigned}/assign`, {
        assigneeId: 's-agent',
        expectedVersion: unassigned.version,
      }),
    )
    expect(error.status).toBe(403)
  })

  it('adds a staff note', async () => {
    await signInAs('support_agent')
    const { data } = await post<CaseDetail>(`/admin/cases/${SCENARIO.paymentDispute}/notes`, {
      body: 'Called Kunle: says the transfer is pending.',
    })
    expect(data.notes.at(-1)).toMatchObject({
      author: 'Chiamaka Eze',
      body: 'Called Kunle: says the transfer is pending.',
    })
  })

  it('never completes a transaction the API does not allow (QA-15)', async () => {
    await signInAs('administrator')
    const { version } = await getTx(TX.partialTimeout)
    const error = await failure(
      post(`/admin/transactions/${TX.partialTimeout}/resolution`, {
        outcome: 'completed',
        reasonCode: 'BOTH_CONFIRMED',
        expectedVersion: version,
      }),
    )
    expect(error.status).toBe(422)
    expect(error.fieldErrors).toHaveProperty('outcome')
  })

  it('cancels a 0 of 2 expiry, releasing the items and resolving the case (QA-14)', async () => {
    await signInAs('administrator')
    const { version } = await getTx(TX.expiredZeroOfTwo)
    const { data } = await post<TransactionActionResult>(`/admin/transactions/${TX.expiredZeroOfTwo}/resolution`, {
      outcome: 'cancelled',
      reasonCode: 'NO_RESPONSE',
      expectedVersion: version,
    })

    expect(data.transaction.status).toBe('RESOLVED_BY_SUPPORT_CANCELLED')
    expect(data.transaction.reservations.every((r) => r.releasedAt !== null)).toBe(true)
    expect(data.transaction.allowedOutcomes).toEqual([])
    expect(data.auditEntry.action).toBe('resolve')
    const linked = await getCase(SCENARIO.expiredZeroOfTwo)
    expect(linked).toMatchObject({ status: 'resolved', decision: { outcome: 'cancelled', reasonCode: 'NO_RESPONSE' } })
  })

  it('keeps resolution for administrators', async () => {
    await signInAs('moderator')
    const error = await failure(
      post(`/admin/transactions/${TX.expiredZeroOfTwo}/resolution?caseId=${SCENARIO.expiredZeroOfTwo}`, {
        outcome: 'cancelled',
        reasonCode: 'NO_RESPONSE',
        expectedVersion: 1,
      }),
    )
    expect(error.status).toBe(403)
  })

  it('releases only items the API marks releasable', async () => {
    await signInAs('administrator')
    const tx = await getTx(TX.disputedCancellation)
    const refused = await failure(
      post(`/admin/transactions/${TX.disputedCancellation}/release`, {
        itemId: 'I-1401',
        reasonCode: 'EVIDENCE_REVIEWED',
        expectedVersion: tx.version,
      }),
    )
    expect(refused.status).toBe(422)

    const { data } = await post<TransactionActionResult>(`/admin/transactions/${TX.disputedCancellation}/release`, {
      itemId: 'I-1402',
      reasonCode: 'EVIDENCE_REVIEWED',
      expectedVersion: tx.version,
    })
    expect(data.transaction.reservations.find((r) => r.itemId === 'I-1402')).toMatchObject({ releasable: false })
    expect(data.transaction.reservations.find((r) => r.itemId === 'I-1402')!.releasedAt).not.toBeNull()
  })

  it('reveals masked data only with a reason, and logs it (ADM-T-02)', async () => {
    await signInAs('moderator')
    const url = `/admin/cases/${SCENARIO.paymentDispute}/reveal`
    const short = await failure(post(url, { field: 'phone', subjectId: 'u-ada', reason: 'check' }))
    expect(short.status).toBe(422)
    expect(short.fieldErrors).toHaveProperty('reason')

    const { data } = await post<RevealResult>(url, {
      field: 'phone',
      subjectId: 'u-ada',
      reason: 'Calling to confirm the handover time',
    })
    expect(data.value).toBe('+2348000001201')
    const { history } = await getCase(SCENARIO.paymentDispute)
    expect(history[0]).toMatchObject({ action: 'view_phone', note: 'Calling to confirm the handover time' })
  })

  it('gives short-lived evidence links', async () => {
    await signInAs('moderator')
    const { data } = await post<RevealResult>(`/admin/cases/${SCENARIO.expiringEvidence}/reveal`, {
      field: 'evidence',
      subjectId: 'ev-210-1',
      reason: 'Comparing the photos with the listing',
    })
    expect(data.url).toMatch(/^https:\/\//)
    expect(Date.parse(data.expiresAt!) - Date.now()).toBeLessThanOrEqual(30_000)
  })

  it('reveals a transaction venue through the case for other staff', async () => {
    await signInAs('support_agent')
    const url = `/admin/transactions/${TX.paymentDispute}/reveal`
    expect((await failure(post(url, { field: 'venue', reason: 'Checking where they met' }))).status).toBe(403)
    const { data } = await post<RevealResult>(`${url}?caseId=${SCENARIO.paymentDispute}`, {
      field: 'venue',
      reason: 'Checking where they met',
    })
    expect(data.value).toMatch(/Lagos/)
  })

  it('applies a write whose answer is lost on the way back', async () => {
    await signInAs('moderator')
    const { version } = await getCase(SCENARIO.abusiveComment)
    casesDb.failNextWithTimeoutAfterApply(SCENARIO.abusiveComment)
    const error = await failure(post(`/admin/cases/${SCENARIO.abusiveComment}/actions`, hideComment(version)))

    expect(error.isOutcomeUnknown).toBe(true)
    expect((await getCase(SCENARIO.abusiveComment)).history[0]!.action).toBe('hide')
  })

  it('has no endpoint that creates a participant confirmation (ADM-T-01)', () => {
    const paths = handlers.map((h) => {
      const { path } = h.info as { path?: unknown }
      return typeof path === 'string' ? path : ''
    })
    expect(paths.some((p) => /confirm/i.test(p))).toBe(false)
    expect(paths.some((p) => p.includes('/actions'))).toBe(true)
  })
})
