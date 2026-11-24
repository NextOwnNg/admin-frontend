import { afterEach, describe, expect, it, vi } from 'vitest'
import { apiClient } from '@/lib/api/client'
import type { InviteDetails, StaffSession } from '@/lib/api/types/auth'
import type { InviteResult, StaffAccountRow } from '@/lib/api/types/staff'
import { auditDb } from '@/mocks/db/audit'
import { signInAs } from '@/test/auth'

type Answer = { status?: number; code?: string; fieldErrors?: Record<string, string> }
const failure = (promise: Promise<unknown>): Promise<Answer> =>
  promise.then(
    (): Answer => ({ status: 200 }),
    (e: Answer) => e,
  )

let keys = 0
const invite = (email: string, displayName = 'Ada Obi', role = 'moderator') =>
  apiClient.post<InviteResult>(
    '/admin/staff/invites',
    { email, displayName, role, reason: 'Joining the weekend moderation shift' },
    { headers: { 'Idempotency-Key': `k-${++keys}` } },
  )
const tokenOf = (row: InviteResult) => new URLSearchParams(row.mockInviteUrl?.split('?')[1]).get('token')!

afterEach(() => vi.useRealTimers())

describe('mock staff administration (design 2026-11-21 §4.3)', () => {
  it('lists staff and invites for administrators only', async () => {
    await signInAs('moderator')
    expect((await failure(apiClient.get('/admin/staff/members'))).status).toBe(403)

    await apiClient.post('/admin/auth/sign-out')
    await signInAs('administrator')
    const { data } = await apiClient.get<StaffAccountRow[]>('/admin/staff/members')
    expect(data.find((r) => r.email === 'ngozi@nextown.test')).toMatchObject({
      role: 'administrator',
      status: 'active',
    })
  })

  it('invites, logs it, and the link signs the invitee in', async () => {
    await signInAs('administrator')
    const { data: row, status } = await invite('ada@nextown.test')
    expect(status).toBe(201)
    expect(row).toMatchObject({ email: 'ada@nextown.test', status: 'invited', role: 'moderator' })
    expect(auditDb.forTarget(row.id).map((e) => e.action)).toEqual(['invite_staff'])

    const token = tokenOf(row)
    const { data: details } = await apiClient.get<InviteDetails>(`/admin/invites/${token}`)
    expect(details).toMatchObject({ email: 'ada@nextown.test', displayName: 'Ada Obi', role: 'moderator' })

    await apiClient.post('/admin/auth/sign-out')
    await apiClient.post(`/admin/invites/${token}/accept`, { password: 'Mangoes7 at Ikeja' })
    const { data: me } = await apiClient.get<StaffSession>('/admin/session')
    expect(me).toMatchObject({ displayName: 'Ada Obi', roles: ['moderator'] })
    expect((await failure(apiClient.get(`/admin/invites/${token}`))).code).toBe('INVITE_INVALID')
  })

  it('treats an invite email like the account’s, whatever its case', async () => {
    await signInAs('administrator')
    const answer = await failure(invite(' Tunde@NextOwn.test'))
    expect(answer).toMatchObject({ status: 422, fieldErrors: { email: 'This email already has staff access.' } })
  })

  it('refuses a second invite while one is waiting', async () => {
    await signInAs('administrator')
    await invite('ada@nextown.test')
    const answer = await failure(invite('ADA@nextown.test'))
    expect(answer.fieldErrors?.email).toBe('An invite is already waiting for this email.')
  })

  it('stops an old link working after a resend or revoke', async () => {
    await signInAs('administrator')
    const { data: row } = await invite('ada@nextown.test')
    const first = tokenOf(row)
    const { data: resent } = await apiClient.post<InviteResult>(
      `/admin/staff/invites/${row.inviteId}/resend`,
      { reason: 'The first email went to spam' },
      { headers: { 'Idempotency-Key': 'resend-1' } },
    )
    expect((await failure(apiClient.get(`/admin/invites/${first}`))).code).toBe('INVITE_INVALID')

    const second = tokenOf(resent)
    const revoked = await apiClient.post(
      `/admin/staff/invites/${row.inviteId}/revoke`,
      { reason: 'Changed plans' },
      { headers: { 'Idempotency-Key': 'revoke-1' } },
    )
    expect(revoked.status).toBe(204)
    expect((await failure(apiClient.get(`/admin/invites/${second}`))).code).toBe('INVITE_INVALID')
    const { data } = await apiClient.get<StaffAccountRow[]>('/admin/staff/members')
    expect(data.some((r) => r.email === 'ada@nextown.test')).toBe(false)
    expect(
      auditDb
        .forTarget(row.id)
        .map((e) => e.action)
        .sort(),
    ).toEqual(['invite_staff', 'resend_invite', 'revoke_invite'])
  })

  it('refuses an invite without a reason', async () => {
    await signInAs('administrator')
    const answer = await failure(
      apiClient.post('/admin/staff/invites', {
        email: 'ada@nextown.test',
        displayName: 'Ada',
        role: 'moderator',
        reason: ' ',
      }),
    )
    expect(answer.status).toBe(422)
  })

  it('lets an invite expire after 7 days', async () => {
    vi.useFakeTimers({ toFake: ['Date'] })
    await signInAs('administrator')
    const { data: row } = await invite('ada@nextown.test')
    vi.setSystemTime(Date.now() + 7 * 24 * 3600_000 + 1000)
    expect((await failure(apiClient.get(`/admin/invites/${tokenOf(row)}`))).code).toBe('INVITE_INVALID')
    const { data } = await apiClient.get<StaffAccountRow[]>('/admin/staff/members')
    expect(data.find((r) => r.email === 'ada@nextown.test')?.status).toBe('invite_expired')
  })
})
