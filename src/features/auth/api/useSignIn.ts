import { useMutation, useQueryClient } from '@tanstack/react-query'
import { requestCode, sessionQueryKey, submitSecondFactor, verifyCode } from '@/features/auth/api/auth-api'
import type { OtpVerifyBody } from '@/lib/api/types/auth'

/** The three sign-in steps. The session is re-read once sign-in completes, which moves the guards on. */
export function useSignIn() {
  const queryClient = useQueryClient()
  const sessionStarted = () => queryClient.invalidateQueries({ queryKey: sessionQueryKey })

  const request = useMutation({ mutationFn: requestCode })
  const verify = useMutation({
    mutationFn: (body: OtpVerifyBody) => verifyCode(body),
    onSuccess: async ({ secondFactorRequired }) => {
      if (!secondFactorRequired) await sessionStarted()
    },
  })
  const secondFactor = useMutation({
    mutationFn: (code: string) => submitSecondFactor({ code }),
    onSuccess: sessionStarted,
  })

  return { request, verify, secondFactor }
}
