import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  login,
  resendSecondFactor,
  resetPassword,
  sessionQueryKey,
  submitSecondFactor,
} from '@/features/auth/api/auth-api'
import type { LoginBody, ResetPasswordBody } from '@/lib/api/types/auth'

/**
 * The sign-in steps: email and password, then the emailed code when the API asks for one. A password reset
 * signs in the same way. The session is re-read once sign-in completes, which moves the guards on.
 */
export function useSignIn() {
  const queryClient = useQueryClient()
  const sessionStarted = () => queryClient.invalidateQueries({ queryKey: sessionQueryKey })
  const afterPassword = async ({ secondFactorRequired }: { secondFactorRequired: boolean }) => {
    if (!secondFactorRequired) await sessionStarted()
  }

  const signIn = useMutation({ mutationFn: (body: LoginBody) => login(body), onSuccess: afterPassword })
  const reset = useMutation({ mutationFn: (body: ResetPasswordBody) => resetPassword(body), onSuccess: afterPassword })
  const secondFactor = useMutation({
    mutationFn: (code: string) => submitSecondFactor({ code }),
    onSuccess: sessionStarted,
  })
  const resend = useMutation({ mutationFn: resendSecondFactor })

  return { signIn, reset, secondFactor, resend }
}
