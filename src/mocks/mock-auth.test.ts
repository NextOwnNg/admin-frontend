import { describe, expect, it } from 'vitest'
import { apiClient } from '@/lib/api/client'
import type { LoginResult, StaffSession } from '@/lib/api/types/auth'
import { staffDb } from '@/mocks/db/staff'
import { SAMPLE_CODE, SAMPLE_PASSWORD, STAFF_EMAILS } from '@/mocks/sample-accounts'
import { signInAs } from '@/test/auth'

const session = () => apiClient.get<StaffSession>('/admin/session')
type Answer = { status?: number; code?: string; retryAfterSeconds?: number }
const failure = (promise: Promise<unknown>): Promise<Answer> =>
  promise.then(
    (): Answer => ({ status: 200 }),
    (e: Answer) => e,
  )
const login = (email: string, password = SAMPLE_PASSWORD) =>
  apiClient.post<LoginResult>('/admin/auth/login', { email, password })

describe('mock admin auth (email and password)', () => {
  it('signs a moderator in with email and password', async () => {
    const { data } = await login(STAFF_EMAILS.moderator)
    expect(data.secondFactorRequired).toBe(false)
    const { data: me } = await session()
    expect(me).toMatchObject({ staffId: 's-mod', displayName: 'Tunde Bakare', roles: ['moderator'] })
    expect(me.idleTimeoutSeconds).toBe(1800)
  })

  it('asks an administrator for an emailed code, then starts the session', async () => {
    const { data } = await login(STAFF_EMAILS.administrator)
    expect(data.secondFactorRequired).toBe(true)
    expect((await failure(session())).status).toBe(401)

    expect(await failure(apiClient.post('/admin/auth/second-factor', { code: '000000' }))).toMatchObject({
      status: 422,
      code: 'OTP_INVALID',
    })
    const resend = await apiClient.post<{ resendAfterSeconds: number }>('/admin/auth/second-factor/resend')
    expect(resend.status).toBe(202)
    await apiClient.post('/admin/auth/second-factor', { code: SAMPLE_CODE })
    expect((await session()).data.roles).toEqual(['administrator'])
  })

  it('answers the same for an unknown email and a wrong password', async () => {
    const unknown = await failure(login('nobody@nextown.test'))
    const wrong = await failure(login(STAFF_EMAILS.moderator, 'Wrong-password-1'))
    for (const answer of [unknown, wrong]) expect(answer).toMatchObject({ status: 401, code: 'INVALID_CREDENTIALS' })
  })

  it('refuses a member after a correct password', async () => {
    expect(await failure(login(STAFF_EMAILS.nonStaff))).toMatchObject({ status: 403, code: 'NOT_STAFF' })
    expect((await failure(session())).status).toBe(401)
  })

  it('locks an email after 5 wrong passwords', async () => {
    for (let i = 0; i < 5; i++) await failure(login(STAFF_EMAILS.moderator, 'Wrong-password-1'))
    const locked = await failure(login(STAFF_EMAILS.moderator))
    expect(locked).toMatchObject({ status: 429, code: 'RATE_LIMITED' })
    expect(locked.retryAfterSeconds).toBeGreaterThan(0)
  })

  it('resets a password with the emailed code and signs in', async () => {
    expect((await apiClient.post('/admin/auth/password/forgot', { email: STAFF_EMAILS.moderator })).status).toBe(202)
    const { data } = await apiClient.post<LoginResult>('/admin/auth/password/reset', {
      email: STAFF_EMAILS.moderator,
      code: SAMPLE_CODE,
      password: 'Mangoes7 at Ikeja',
    })
    expect(data.secondFactorRequired).toBe(false)
    expect((await session()).data.staffId).toBe('s-mod')

    await apiClient.post('/admin/auth/sign-out')
    expect((await failure(login(STAFF_EMAILS.moderator))).code).toBe('INVALID_CREDENTIALS')
    expect((await login(STAFF_EMAILS.moderator, 'Mangoes7 at Ikeja')).status).toBe(200)
  })

  it('answers forgot password the same for any email', async () => {
    const { status, data } = await apiClient.post<{ resendAfterSeconds: number }>('/admin/auth/password/forgot', {
      email: 'nobody@nextown.test',
    })
    expect(status).toBe(202)
    expect(data.resendAfterSeconds).toBe(60)
  })

  it('answers a reset the same for an unknown email as for a wrong code (final review)', async () => {
    const reset = (email: string) =>
      failure(apiClient.post('/admin/auth/password/reset', { email, code: '000000', password: 'Mangoes7 at Ikeja' }))
    await apiClient.post('/admin/auth/password/forgot', { email: 'nobody@nextown.test' })
    await apiClient.post('/admin/auth/password/forgot', { email: STAFF_EMAILS.moderator })
    const unknown = await reset('nobody@nextown.test')
    const staff = await reset(STAFF_EMAILS.moderator)
    const answer = ({ status, code }: Answer) => ({ status, code })
    expect(answer(unknown)).toEqual(answer(staff))
    expect(staff).toMatchObject({ status: 422, code: 'OTP_INVALID' })
  })

  it('refuses a new password under 8 characters', async () => {
    await apiClient.post('/admin/auth/password/forgot', { email: STAFF_EMAILS.moderator })
    const answer = await failure(
      apiClient.post('/admin/auth/password/reset', {
        email: STAFF_EMAILS.moderator,
        code: SAMPLE_CODE,
        password: 'short',
      }),
    )
    expect(answer).toMatchObject({ status: 422, code: 'VALIDATION_ERROR' })
  })

  it('ends the session when the server expires it', async () => {
    await signInAs('support_agent')
    staffDb.expireSession()
    expect((await failure(session())).status).toBe(401)
  })

  it('signs out', async () => {
    await signInAs('moderator')
    await apiClient.post('/admin/auth/sign-out')
    expect((await failure(session())).status).toBe(401)
  })

  it('lets tests shorten the idle timeout', async () => {
    staffDb.setIdleTimeout(120)
    await signInAs('moderator')
    expect((await session()).data.idleTimeoutSeconds).toBe(120)
  })
})
