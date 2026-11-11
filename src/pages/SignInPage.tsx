import { Button } from '@heroui/react'
import { useQueryClient } from '@tanstack/react-query'
import { lazy, Suspense, useState, type ComponentType } from 'react'
import { PageHead } from '@/components/seo/PageHead'
import { Banner } from '@/components/ui/Banner'
import { sessionQueryKey } from '@/features/auth/api/auth-api'
import { useSignIn } from '@/features/auth/api/useSignIn'
import { endSession } from '@/features/auth/api/useSignOut'
import { CodeStep } from '@/features/auth/components/CodeStep'
import { PhoneStep } from '@/features/auth/components/PhoneStep'
import type { SampleSignInProps } from '@/features/auth/components/SampleSignIn'
import { ApiError } from '@/lib/api/api-error'
import type { StaffSession } from '@/lib/api/types/auth'
import { errorMessage, fieldError } from '@/lib/api/error-message'
import { formatPhoneDisplay } from '@/lib/phone/phone'
import { useSessionStore } from '@/stores/session'

/**
 * The sample accounts load only while the mock API is on. The comparison is inline so the production build
 * drops the module, with the sample phones and codes (design §7).
 */
const defaultSampleSignIn =
  import.meta.env.VITE_USE_MOCK_API === 'true'
    ? lazy(() => import('@/features/auth/components/SampleSignIn').then((m) => ({ default: m.SampleSignIn })))
    : null

type Step = { kind: 'phone' } | { kind: 'code'; phone: string } | { kind: 'second-factor' }

/**
 * Staff sign-in (PRD §3.5): phone, texted code, then a second code when the API asks for one. Once the
 * session starts, `RedirectIfStaff` moves on to `next`. Says nothing about what the console contains.
 */
export function SignInPage({
  sampleSignIn: SampleSignIn = defaultSampleSignIn,
}: {
  sampleSignIn?: ComponentType<SampleSignInProps> | null
}) {
  const [step, setStep] = useState<Step>({ kind: 'phone' })
  const [pageError, setPageError] = useState<unknown>(null)
  const { request, verify, secondFactor } = useSignIn()
  const queryClient = useQueryClient()

  async function sendCode(phone: string) {
    setPageError(null)
    try {
      await request.mutateAsync(phone)
      setStep({ kind: 'code', phone })
    } catch (error) {
      // A rejected number shows on the field; anything else is the banner above the form
      if (!fieldError(error, 'phone')) setPageError(error)
      throw error
    }
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
    setStep({ kind: 'phone' })
    setPageError(new ApiError({ kind: 'http', status: 403, code: 'NOT_STAFF', message: 'Not staff' }))
  }

  async function verifyCode(phone: string, code: string) {
    setPageError(null)
    const { secondFactorRequired } = await verify.mutateAsync({ phone, code })
    if (secondFactorRequired) setStep({ kind: 'second-factor' })
    else refuseUnlessStaff()
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

        {step.kind === 'phone' && <PhoneStep onSubmit={sendCode} />}
        {step.kind === 'code' && (
          <CodeStep
            key="code"
            heading="Enter the code we sent"
            intro={`We sent a 6-digit code to ${formatPhoneDisplay(step.phone)}.`}
            label="6-digit code"
            submitLabel="Verify"
            onSubmit={(code) => verifyCode(step.phone, code)}
            onPageError={setPageError}
            secondary={
              <Button
                variant="tertiary"
                onPress={() => {
                  setPageError(null)
                  setStep({ kind: 'phone' })
                }}
              >
                Use a different number
              </Button>
            }
          />
        )}
        {step.kind === 'second-factor' && (
          <CodeStep
            key="second-factor"
            heading="Enter your second code"
            intro="Your account needs a second code to finish signing in."
            label="Second code"
            submitLabel="Continue"
            onSubmit={async (code) => {
              setPageError(null)
              await secondFactor.mutateAsync(code)
              refuseUnlessStaff()
            }}
            onPageError={setPageError}
          />
        )}

        {SampleSignIn && step.kind === 'phone' && (
          <Suspense fallback={null}>
            <SampleSignIn
              request={request}
              verify={verify}
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
