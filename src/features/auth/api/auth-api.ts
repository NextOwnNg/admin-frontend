import { apiClient } from '@/lib/api/client'
import { isSignedOut } from '@/lib/api/error-checks'
import type {
  OtpRequestResult,
  OtpVerifyResult,
  SecondFactorBody,
  StaffSession,
  OtpVerifyBody,
} from '@/lib/api/types/auth'

/** Typed staff-auth endpoints (PRD §3.5). Only the hooks in this folder call them. */

export const sessionQueryKey = ['admin', 'session'] as const

/** The current staff session, or null when signed out (a 401 here is an answer, not an error). */
export async function getSession({ signal }: { signal?: AbortSignal } = {}): Promise<StaffSession | null> {
  try {
    const { data } = await apiClient.get<StaffSession>('/admin/session', { signal })
    return data
  } catch (error) {
    if (isSignedOut(error)) return null
    throw error
  }
}

export async function requestCode(phone: string): Promise<OtpRequestResult> {
  const { data } = await apiClient.post<OtpRequestResult>('/admin/auth/otp/request', { phone })
  return data
}

export async function verifyCode(body: OtpVerifyBody): Promise<OtpVerifyResult> {
  const { data } = await apiClient.post<OtpVerifyResult>('/admin/auth/otp/verify', body)
  return data
}

export async function submitSecondFactor(body: SecondFactorBody): Promise<void> {
  await apiClient.post('/admin/auth/second-factor', body)
}

export async function signOut(): Promise<void> {
  await apiClient.post('/admin/auth/sign-out')
}
