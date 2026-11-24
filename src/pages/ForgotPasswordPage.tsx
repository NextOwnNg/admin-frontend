import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@heroui/react'
import { useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link } from 'react-router'
import { z } from 'zod'
import { PageHead } from '@/components/seo/PageHead'
import { Banner } from '@/components/ui/Banner'
import { TextField } from '@/components/ui/TextField'
import { forgotPassword, sessionQueryKey } from '@/features/auth/api/auth-api'
import { useSignIn } from '@/features/auth/api/useSignIn'
import { CodeStep } from '@/features/auth/components/CodeStep'
import { ResendCode } from '@/features/auth/components/ResendCode'
import { ResetStep } from '@/features/auth/components/ResetStep'
import { maskEmail } from '@/features/auth/mask-email'
import { emailSchema } from '@/features/auth/schemas'
import { errorMessage } from '@/lib/api/error-message'
import { AUTH_COPY } from '@/lib/copy/auth'

const emailFormSchema = z.object({ email: emailSchema })
type EmailForm = z.output<typeof emailFormSchema>

type Step =
  { kind: 'email' } | { kind: 'reset'; email: string; resendAfterSeconds: number } | { kind: 'code'; email: string }

/** The wait before the first second-factor resend: the reset answer doesn't carry one */
const FIRST_RESEND_WAIT_SECONDS = 60

/**
 * Forgot password (design 2026-11-21 §4.2): an emailed code, then a new password, then signed in. The answer
 * is the same for any email, so the page never says whether an account exists. An administrator still enters
 * their second code; the session refresh then lets `RedirectIfStaff` carry on to `next`.
 */
export function ForgotPasswordPage() {
  const [step, setStep] = useState<Step>({ kind: 'email' })
  const [pageError, setPageError] = useState<unknown>(null)
  const { reset, secondFactor, resend } = useSignIn()
  const queryClient = useQueryClient()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<EmailForm>({ resolver: zodResolver(emailFormSchema), defaultValues: { email: '' } })

  const sendCode = handleSubmit(async ({ email }) => {
    setPageError(null)
    try {
      const { resendAfterSeconds } = await forgotPassword({ email })
      setStep({ kind: 'reset', email, resendAfterSeconds })
    } catch (error) {
      setPageError(error)
    }
  })

  return (
    <>
      <PageHead title="Reset your password" />
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-h2 text-ink">Reset your password</h1>
          <p className="text-body text-muted">We'll email you a code to choose a new one.</p>
        </div>

        {pageError !== null && <Banner tone="error" title={errorMessage(pageError, 'Your password wasn’t reset.')} />}

        {step.kind === 'email' && (
          <form noValidate onSubmit={(e) => void sendCode(e)} className="flex flex-col gap-5">
            <TextField
              label="Email"
              type="email"
              autoComplete="username"
              inputMode="email"
              autoCapitalize="none"
              spellCheck={false}
              error={errors.email?.message}
              {...register('email')}
            />
            <Button type="submit" isPending={isSubmitting} fullWidth>
              Send code
            </Button>
          </form>
        )}

        {step.kind === 'reset' && (
          <>
            <Banner tone="info" title={AUTH_COPY.codeSent} />
            <ResetStep
              intro={`Enter the code sent to ${maskEmail(step.email)}, then your new password.`}
              onPageError={setPageError}
              onSubmit={async ({ code, password }) => {
                setPageError(null)
                const { secondFactorRequired } = await reset.mutateAsync({ email: step.email, code, password })
                if (secondFactorRequired) setStep({ kind: 'code', email: step.email })
              }}
              resend={
                <ResendCode
                  initialWait={step.resendAfterSeconds}
                  onResend={() => forgotPassword({ email: step.email })}
                  onError={setPageError}
                />
              }
              secondary={
                <Button
                  variant="tertiary"
                  onPress={() => {
                    setPageError(null)
                    setStep({ kind: 'email' })
                  }}
                >
                  Use a different email
                </Button>
              }
            />
          </>
        )}

        {step.kind === 'code' && (
          <CodeStep
            heading="Enter the code we emailed you"
            intro={`Your password is changed. We sent a 6-digit code to ${maskEmail(step.email)}.`}
            label="6-digit code"
            submitLabel="Continue"
            onSubmit={async (code) => {
              setPageError(null)
              await secondFactor.mutateAsync(code)
              await queryClient.invalidateQueries({ queryKey: sessionQueryKey })
            }}
            onPageError={setPageError}
            resend={
              <ResendCode
                initialWait={FIRST_RESEND_WAIT_SECONDS}
                onResend={() => resend.mutateAsync()}
                onError={setPageError}
              />
            }
          />
        )}

        <Link to="/sign-in" className="self-start text-compact font-semibold text-action underline underline-offset-2">
          Back to sign in
        </Link>
      </div>
    </>
  )
}
