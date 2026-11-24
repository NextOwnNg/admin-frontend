import type { useSignIn } from '@/features/auth/api/useSignIn'
import { SampleAccounts } from '@/features/auth/components/SampleAccounts'
import type { StaffRole } from '@/lib/copy/labels'
import { SAMPLE_CODE, SAMPLE_PASSWORD, STAFF_EMAILS } from '@/mocks/sample-accounts'

export type SampleSignInProps = Pick<ReturnType<typeof useSignIn>, 'signIn' | 'secondFactor'> & {
  onStart: () => void
  onSignedIn: () => void
  onError: (error: unknown) => void
}

/**
 * One-click sign-in through the sample accounts. Its own module, loaded only when the mock API is on, so a
 * production build carries neither the sample emails, the password nor the code (design §7).
 */
export function SampleSignIn({ signIn, secondFactor, onStart, onSignedIn, onError }: SampleSignInProps) {
  async function signInAsSample(role: StaffRole) {
    onStart()
    try {
      const { secondFactorRequired } = await signIn.mutateAsync({
        email: STAFF_EMAILS[role],
        password: SAMPLE_PASSWORD,
      })
      if (secondFactorRequired) await secondFactor.mutateAsync(SAMPLE_CODE)
      onSignedIn()
    } catch (error) {
      onError(error)
    }
  }

  return <SampleAccounts onSignIn={signInAsSample} />
}
