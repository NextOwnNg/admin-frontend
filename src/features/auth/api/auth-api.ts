import { apiClient } from '@/lib/api/client'
import { isSignedOut } from '@/lib/api/error-checks'
import type {
  AcceptInviteBody,
  ForgotPasswordBody,
  InviteDetails,
  LoginBody,
  LoginResult,
  ResendResult,
  ResetPasswordBody,
  SecondFactorBody,
  StaffSession,
} from '@/lib/api/types/auth'

/** Typed staff-auth endpoints (PRD §3.5). Only the hooks in this folder call them. */

export const sessionQueryKey = ['admin', 'session'] as const

/** The session check gives up sooner than other reads */
export const SESSION_TIMEOUT_MS = 4_000

/** The current staff session, or null when signed out (a 401 here is an answer, not an error). */
export async function getSession({ signal }: { signal?: AbortSignal } = {}): Promise<StaffSession | null> {
  try {
    // A short timeout: a dead network should reach the retry state in seconds, not a minute (PRD §3.3)
    const { data } = await apiClient.get<StaffSession>('/admin/session', { signal, timeout: SESSION_TIMEOUT_MS })
    return data
  } catch (error) {
    if (isSignedOut(error)) return null
    throw error
  }
}

export async function login(body: LoginBody): Promise<LoginResult> {
  const { data } = await apiClient.post<LoginResult>('/admin/auth/login', body)
  return data
}

export async function submitSecondFactor(body: SecondFactorBody): Promise<void> {
  await apiClient.post('/admin/auth/second-factor', body)
}

export async function resendSecondFactor(): Promise<ResendResult> {
  const { data } = await apiClient.post<ResendResult>('/admin/auth/second-factor/resend')
  return data
}

/** The same answer for any email: nothing says whether it has an account */
export async function forgotPassword(body: ForgotPasswordBody): Promise<ResendResult> {
  const { data } = await apiClient.post<ResendResult>('/admin/auth/password/forgot', body)
  return data
}

export async function resetPassword(body: ResetPasswordBody): Promise<LoginResult> {
  const { data } = await apiClient.post<LoginResult>('/admin/auth/password/reset', body)
  return data
}

export async function getInvite(token: string, { signal }: { signal?: AbortSignal } = {}): Promise<InviteDetails> {
  const { data } = await apiClient.get<InviteDetails>(`/admin/invites/${encodeURIComponent(token)}`, { signal })
  return data
}

export async function acceptInvite(token: string, body: AcceptInviteBody): Promise<void> {
  await apiClient.post(`/admin/invites/${encodeURIComponent(token)}/accept`, body)
}

export async function signOut(): Promise<void> {
  await apiClient.post('/admin/auth/sign-out')
}
