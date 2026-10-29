import { describe, expect, it } from 'vitest'
import { apiClient } from '@/lib/api/client'
import type { OtpVerifyResult, StaffSession } from '@/lib/api/types/auth'
import { STAFF_PHONES, staffDb } from '@/mocks/db/staff'
import { SAMPLE_CODE, SAMPLE_SECOND_FACTOR } from '@/mocks/sample-code'
import { signInAs } from '@/test/auth'

const session = () => apiClient.get<StaffSession>('/admin/session')
const status = (promise: Promise<unknown>) =>
  promise.then(
    () => 200,
    (e: { status?: number }) => e.status,
  )

async function verify(phone: string, code = SAMPLE_CODE) {
  await apiClient.post('/admin/auth/otp/request', { phone })
  return apiClient.post<OtpVerifyResult>('/admin/auth/otp/verify', { phone, code })
}

describe('mock admin auth', () => {
  it('signs a moderator in with one code', async () => {
    const { data } = await verify(STAFF_PHONES.moderator)

    expect(data.secondFactorRequired).toBe(false)
    const { data: me } = await session()
    expect(me).toMatchObject({ staffId: 's-mod', displayName: 'Tunde Bakare', roles: ['moderator'] })
    expect(me.idleTimeoutSeconds).toBe(1800)
  })

  it('asks the administrator for a second code before the session starts', async () => {
    const { data } = await verify(STAFF_PHONES.administrator)

    expect(data.secondFactorRequired).toBe(true)
    expect(await status(session())).toBe(401)

    await apiClient.post('/admin/auth/second-factor', { code: SAMPLE_SECOND_FACTOR })
    expect((await session()).data.roles).toEqual(['administrator'])
  })

  it('rejects a wrong code', async () => {
    const error = await verify(STAFF_PHONES.moderator, '000000').catch((e: unknown) => e)
    expect(error).toMatchObject({ status: 422, code: 'OTP_INVALID' })
  })

  it('refuses a number that is not a staff account', async () => {
    const error = await verify(STAFF_PHONES.nonStaff).catch((e: unknown) => e)
    expect(error).toMatchObject({ status: 403, code: 'NOT_STAFF' })
    expect(await status(session())).toBe(401)
  })

  it('validates the phone number', async () => {
    const error = await apiClient.post('/admin/auth/otp/request', { phone: '12345' }).catch((e: unknown) => e)
    expect(error).toMatchObject({ status: 422, code: 'VALIDATION_ERROR' })
  })

  it('rate limits the fourth code request in the window', async () => {
    const request = () => apiClient.post('/admin/auth/otp/request', { phone: STAFF_PHONES.moderator })
    await request()
    await request()
    await request()

    const error = await request().catch((e: unknown) => e)
    expect(error).toMatchObject({ status: 429, code: 'RATE_LIMITED' })
    expect((error as { retryAfterSeconds?: number }).retryAfterSeconds).toBeGreaterThan(0)
  })

  it('ends the session when the server expires it', async () => {
    await signInAs('support_agent')
    staffDb.expireSession()
    expect(await status(session())).toBe(401)
  })

  it('signs out', async () => {
    await signInAs('moderator')
    await apiClient.post('/admin/auth/sign-out')
    expect(await status(session())).toBe(401)
  })

  it('lets tests shorten the idle timeout', async () => {
    staffDb.setIdleTimeout(120)
    await signInAs('moderator')
    expect((await session()).data.idleTimeoutSeconds).toBe(120)
  })
})
