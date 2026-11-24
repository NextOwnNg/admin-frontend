import { apiClient } from '@/lib/api/client'
import type { LoginResult, StaffRole, StaffSession } from '@/lib/api/types/auth'
import { SAMPLE_CODE, SAMPLE_PASSWORD, STAFF_EMAILS } from '@/mocks/sample-accounts'
import { applySession } from '@/stores/session'

/** Signs a sample staff account in through the mock API, as the sign-in page would. */
export async function signInAs(role: StaffRole) {
  const { data } = await apiClient.post<LoginResult>('/admin/auth/login', {
    email: STAFF_EMAILS[role],
    password: SAMPLE_PASSWORD,
  })
  if (data.secondFactorRequired) await apiClient.post('/admin/auth/second-factor', { code: SAMPLE_CODE })
}

/** Signs in and mirrors the session into the store, for components rendered outside the app shell. */
export async function signInWithSession(role: StaffRole) {
  await signInAs(role)
  const { data } = await apiClient.get<StaffSession>('/admin/session')
  applySession(data)
}
