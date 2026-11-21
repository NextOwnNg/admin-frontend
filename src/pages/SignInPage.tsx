import { Button } from '@heroui/react'
import { useQueryClient } from '@tanstack/react-query'
import { lazy, Suspense, useRef, useState, type ComponentType } from 'react'
import { PageHead } from '@/components/seo/PageHead'
import { Banner } from '@/components/ui/Banner'
import { sessionQueryKey, signOut } from '@/features/auth/api/auth-api'
import { useSignIn } from '@/features/auth/api/useSignIn'
import { endSession } from '@/features/auth/api/useSignOut'
import { CodeStep } from '@/features/auth/components/CodeStep'
import { CredentialsStep } from '@/features/auth/components/CredentialsStep'
import { ResendCode } from '@/features/auth/components/ResendCode'
import type { SampleSignInProps } from '@/features/auth/components/SampleSignIn'
import { ApiError } from '@/lib/api/api-error'
import type { StaffSession } from '@/lib/api/types/auth'
import { errorMessage } from '@/lib/api/error-message'
import { maskEmail } from '@/features/auth/mask-email'
import type { SignInForm } from '@/features/auth/schemas'
import { useSearchParams } from 'react-router'
import { useSessionStore } from '@/stores/session'

/**
 * The sample accounts load only while the mock API is on. The comparison is inline so the production build
 * drops the module, with the sample emails, password and code (design §7).
 */
const defaultSampleSignIn =
  import.meta.env.VITE_USE_MOCK_API === 'true'
    ? lazy(() => import('@/features/auth/components/SampleSignIn').then((m) => ({ default: m.SampleSignIn })))
    : null

type Step = { kind: 'credentials' } | { kind: 'code'; email: string; resendAfterSeconds: number }

/** The wait before the first resend: the API's answer comes only with a resend, so the usual minute */
const FIRST_RESEND_WAIT_SECONDS = 60

/**
 * Staff sign-in (design 2026-11-21 §4.1): email and password, then a code from their email when the API asks
 * for one. Once the session starts, `RedirectIfStaff` moves on to `next`. Says nothing about what the console
 * contains, nor whether an email has an account.
 */
export function SignInPage({
  sampleSignIn: SampleSignIn = defaultSampleSignIn,
}: {
  sampleSignIn?: ComponentType<SampleSignInProps> | null
}) {
  const [step, setStep] = useState<Step>({ kind: 'credentials' })
  const [pageError, setPageError] = useState<unknown>(null)
  const abandoned = useRef<Promise<void>>(Promise.resolve())
  const { signIn, secondFactor, resend } = useSignIn()
  const queryClient = useQueryClient()
  const [params] = useSearchParams()
  const next = params.get('next')
  const forgotHref = next ? `/forgot-password?next=${encodeURIComponent(next)}` : '/forgot-password'

  async function submitCredentials({ email, password }: SignInForm) {
    setPageError(null)
    await abandoned.current
    try {
      const { secondFactorRequired } = await signIn.mutateAsync({ email, password })
      if (secondFactorRequired) setStep({ kind: 'code', email, resendAfterSeconds: FIRST_RESEND_WAIT_SECONDS })
      else refuseUnlessStaff()
    } catch (error) {
      setPageError(error)
    }
  }

  /**
   * Abandons a sign-in waiting for its code: the server forgets it, and the form starts empty. Nothing about the
   * console is cached yet, so only the server call is needed; the next sign-in waits for it, so the two can't cross.
   */
  function startAgain() {
    setPageError(null)
    abandoned.current = signOut().catch(() => {})
    setStep({ kind: 'credentials' })
  }

  /**
   * Sign-in finished but the session holds no role the console knows (the store refuses it): say so, end the
   * half-made server session and start again, instead of sitting on the code step. Only a session the server
   * actually sent counts: a read that failed says so and keeps the session, which may well be valid.
   */
  function refuseUnlessStaff() {
    if (useSessionStore.getState().status === 'staff') return
    const read = queryClient.getQueryState<StaffSession | null>(sessionQueryKey)
    if (read?.status === 'error' || !read?.data) {
      setPageError(read?.error ?? new ApiError({ kind: 'network', code: 'NETWORK_ERROR', message: 'No session' }))
      return
    }
    endSession(queryClient)
    setStep({ kind: 'credentials' })
    setPageError(new ApiError({ kind: 'http', status: 403, code: 'NOT_STAFF', message: 'Not staff' }))
  }

  return (
    <>
      <PageHead title="Sign in" />
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-h2 text-ink">Sign in to NextOwn Admin</h1>
          <p className="text-body text-muted">For NextOwn staff accounts only.</p>
        </div>

        {pageError !== null && <Banner tone="error" title={errorMessage(pageError, 'You weren’t signed in.')} />}

        {step.kind === 'credentials' && <CredentialsStep onSubmit={submitCredentials} forgotHref={forgotHref} />}
        {step.kind === 'code' && (
          <CodeStep
            key="code"
            heading="Enter the code we emailed you"
            intro={`We sent a 6-digit code to ${maskEmail(step.email)}.`}
            label="6-digit code"
            submitLabel="Continue"
            onSubmit={async (code) => {
              setPageError(null)
              await secondFactor.mutateAsync(code)
              refuseUnlessStaff()
            }}
            onPageError={setPageError}
            resend={
              <ResendCode
                initialWait={step.resendAfterSeconds}
                onResend={() => resend.mutateAsync()}
                onError={setPageError}
              />
            }
            secondary={
              <Button variant="tertiary" onPress={startAgain}>
                Use a different account
              </Button>
            }
          />
        )}

        {SampleSignIn && step.kind === 'credentials' && (
          <Suspense fallback={null}>
            <SampleSignIn
              signIn={signIn}
              secondFactor={secondFactor}
              onStart={() => setPageError(null)}
              onSignedIn={refuseUnlessStaff}
              onError={setPageError}
            />
          </Suspense>
        )}
      </div>
    </>
  )
}
