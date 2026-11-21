import { http, HttpResponse, type RequestHandler } from 'msw'
import { PASSWORD_MAX, PASSWORD_MIN } from '@/features/auth/schemas'
import type {
  AcceptInviteBody,
  ForgotPasswordBody,
  LoginBody,
  ResetPasswordBody,
  SecondFactorBody,
} from '@/lib/api/types/auth'
import { AUTH_COPY } from '@/lib/copy/auth'
import { apiBaseUrl } from '@/lib/env'
import { staffAuthLimits, staffDb, type LoginOutcome } from '@/mocks/db/staff'
import { error } from '@/mocks/handlers/http'
import { network } from '@/mocks/handlers/network'

const API = `${apiBaseUrl}/admin`

const otpInvalid = () => error(422, 'OTP_INVALID', "That code doesn't match")
const rateLimited = (retryAfter: number) => error(429, 'RATE_LIMITED', 'Too many requests', { retryAfter })
const codeSent = () => HttpResponse.json({ resendAfterSeconds: staffAuthLimits.resendAfterSeconds }, { status: 202 })
const inviteInvalid = () => error(404, 'INVITE_INVALID', 'Invite not found')

/** A new password, checked as the console checks it: 8 to 128 characters */
const passwordProblem = (password: unknown) =>
  typeof password !== 'string' || password.length < PASSWORD_MIN || password.length > PASSWORD_MAX
    ? error(422, 'VALIDATION_ERROR', 'Check the highlighted fields', {
        fieldErrors: { password: AUTH_COPY.passwordRule },
      })
    : null

/** Sign-in answers: the same for an unknown email and a wrong password (design 2026-11-21 §2) */
function signInAnswer(result: LoginOutcome) {
  if (result.ok) return HttpResponse.json({ secondFactorRequired: result.secondFactorRequired })
  if (result.reason === 'locked') return rateLimited(result.retryAfterSeconds)
  if (result.reason === 'not_staff') return error(403, 'NOT_STAFF', 'Not a staff account')
  return error(401, 'INVALID_CREDENTIALS', 'Email or password is wrong')
}

export const authHandlers: RequestHandler[] = [
  http.post(`${API}/auth/login`, async ({ request }) => {
    const failure = await network()
    if (failure) return failure
    const { email = '', password = '' } = (await request.json()) as Partial<LoginBody>
    return signInAnswer(staffDb.login(email, password))
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

  http.post(`${API}/auth/second-factor/resend`, async () => {
    const failure = await network()
    if (failure) return failure
    const result = staffDb.resendSecondFactor()
    if (result === null) return error(401, 'AUTH_REQUIRED', 'Sign in to continue')
    return result.ok ? codeSent() : rateLimited(result.retryAfterSeconds)
  }),

  // The same answer for any email: nothing says whether it has an account
  http.post(`${API}/auth/password/forgot`, async ({ request }) => {
    const failure = await network()
    if (failure) return failure
    const { email = '' } = (await request.json()) as Partial<ForgotPasswordBody>
    const result = staffDb.forgotPassword(email)
    return result.ok ? codeSent() : rateLimited(result.retryAfterSeconds)
  }),

  http.post(`${API}/auth/password/reset`, async ({ request }) => {
    const failure = await network()
    if (failure) return failure
    const { email = '', code = '', password } = (await request.json()) as Partial<ResetPasswordBody>
    const invalidPassword = passwordProblem(password)
    if (invalidPassword) return invalidPassword
    const result = staffDb.resetPassword(email, code, password!)
    if (!result.ok && result.reason === 'expired') return error(422, 'OTP_EXPIRED', 'Code expired')
    if (!result.ok && result.reason === 'invalid') return otpInvalid()
    return signInAnswer(result)
  }),

  http.get(`${API}/invites/:token`, async ({ params }) => {
    const failure = await network()
    if (failure) return failure
    const details = staffDb.inviteByToken(String(params.token))
    return details ? HttpResponse.json(details) : inviteInvalid()
  }),

  http.post(`${API}/invites/:token/accept`, async ({ params, request }) => {
    const failure = await network()
    if (failure) return failure
    const { password } = (await request.json()) as Partial<AcceptInviteBody>
    const invalidPassword = passwordProblem(password)
    if (invalidPassword) return invalidPassword
    return staffDb.acceptInvite(String(params.token), password!)
      ? new HttpResponse(null, { status: 204 })
      : inviteInvalid()
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
