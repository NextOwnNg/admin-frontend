import type { useSignIn } from '@/features/auth/api/useSignIn'
import { SampleAccounts } from '@/features/auth/components/SampleAccounts'
import type { StaffRole } from '@/lib/copy/labels'
import { SAMPLE_CODE, SAMPLE_SECOND_FACTOR, STAFF_PHONES } from '@/mocks/sample-code'

export type SampleSignInProps = ReturnType<typeof useSignIn> & {
  onStart: () => void
  onSignedIn: () => void
  onError: (error: unknown) => void
}

/**
 * One-click sign-in through the sample accounts. Its own module, loaded only when the mock API is on, so a
 * production build carries neither the sample phones nor the codes (design §7).
 */
export function SampleSignIn({ request, verify, secondFactor, onStart, onSignedIn, onError }: SampleSignInProps) {
  async function signInAsSample(role: StaffRole) {
    onStart()
    try {
      const phone = STAFF_PHONES[role]
      await request.mutateAsync(phone)
      const { secondFactorRequired } = await verify.mutateAsync({ phone, code: SAMPLE_CODE })
      if (secondFactorRequired) await secondFactor.mutateAsync(SAMPLE_SECOND_FACTOR)
      onSignedIn()
    } catch (error) {
      onError(error)
    }
  }

  return <SampleAccounts onSignIn={signInAsSample} />
}
