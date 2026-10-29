import { http, HttpResponse, type RequestHandler } from 'msw'
import type { OtpRequestBody, OtpVerifyBody, SecondFactorBody } from '@/lib/api/types/auth'
import { apiBaseUrl } from '@/lib/env'
import { staffAuthLimits, staffDb } from '@/mocks/db/staff'
import { error } from '@/mocks/handlers/http'
import { network } from '@/mocks/handlers/network'

const API = `${apiBaseUrl}/admin`

const isNigerianMobile = (phone: unknown): phone is string =>
  typeof phone === 'string' && /^\+234[789]\d{9}$/.test(phone)

const otpInvalid = () => error(422, 'OTP_INVALID', "That code doesn't match")

export const authHandlers: RequestHandler[] = [
  http.post(`${API}/auth/otp/request`, async ({ request }) => {
    const failure = await network()
    if (failure) return failure

    const { phone } = (await request.json()) as Partial<OtpRequestBody>
    if (!isNigerianMobile(phone)) {
      return error(422, 'VALIDATION_ERROR', 'Check the highlighted fields', {
        fieldErrors: { phone: 'Enter a Nigerian mobile number, like 0800 000 0101.' },
      })
    }

    // The same answer whether or not the number is a staff account: nothing about the console is revealed
    const result = staffDb.requestCode(phone)
    if (!result.ok) return error(429, 'RATE_LIMITED', 'Too many requests', { retryAfter: result.retryAfterSeconds })
    return HttpResponse.json({ resendAfterSeconds: staffAuthLimits.resendAfterSeconds }, { status: 202 })
  }),

  http.post(`${API}/auth/otp/verify`, async ({ request }) => {
    const failure = await network()
    if (failure) return failure

    const { phone = '', code = '' } = (await request.json()) as Partial<OtpVerifyBody>
    const result = staffDb.verify(phone, code)
    if (result.ok) return HttpResponse.json({ secondFactorRequired: result.secondFactorRequired })
    if (result.reason === 'not_staff') return error(403, 'NOT_STAFF', 'Not a staff account')
    if (result.reason === 'expired') return error(422, 'OTP_EXPIRED', 'Code expired')
    return otpInvalid()
  }),

  http.post(`${API}/auth/second-factor`, async ({ request }) => {
    const failure = await network()
    if (failure) return failure

    const { code = '' } = (await request.json()) as Partial<SecondFactorBody>
    const result = staffDb.secondFactor(code)
    if (result === null) return error(401, 'AUTH_REQUIRED', 'Sign in to continue')
    if (!result) return otpInvalid()
    return new HttpResponse(null, { status: 204 })
  }),

  http.post(`${API}/auth/sign-out`, async () => {
    const failure = await network()
    if (failure) return failure
    staffDb.signOut()
    return new HttpResponse(null, { status: 204 })
  }),

  http.get(`${API}/session`, async () => {
    const failure = await network()
    if (failure) return failure
    const session = staffDb.current()
    return session ? HttpResponse.json(session) : error(401, 'AUTH_REQUIRED', 'Sign in to continue')
  }),
]
