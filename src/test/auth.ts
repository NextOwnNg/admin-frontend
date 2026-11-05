import { apiClient } from '@/lib/api/client'
import type { StaffRole, StaffSession } from '@/lib/api/types/auth'
import { SAMPLE_CODE, SAMPLE_SECOND_FACTOR, STAFF_PHONES } from '@/mocks/sample-code'
import { applySession } from '@/stores/session'

/** Signs a sample staff account in through the mock API, as the sign-in page would. */
export async function signInAs(role: StaffRole) {
  const phone = STAFF_PHONES[role]
  await apiClient.post('/admin/auth/otp/request', { phone })
  const { data } = await apiClient.post<{ secondFactorRequired: boolean }>('/admin/auth/otp/verify', {
    phone,
    code: SAMPLE_CODE,
  })
  if (data.secondFactorRequired) await apiClient.post('/admin/auth/second-factor', { code: SAMPLE_SECOND_FACTOR })
}

/** Signs in and mirrors the session into the store, for components rendered outside the app shell. */
export async function signInWithSession(role: StaffRole) {
  await signInAs(role)
  const { data } = await apiClient.get<StaffSession>('/admin/session')
  applySession(data)
}
