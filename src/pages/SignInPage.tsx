import { Button } from '@heroui/react'
import { useState } from 'react'
import { PageHead } from '@/components/seo/PageHead'
import { Banner } from '@/components/ui/Banner'
import { useSignIn } from '@/features/auth/api/useSignIn'
import { CodeStep } from '@/features/auth/components/CodeStep'
import { PhoneStep } from '@/features/auth/components/PhoneStep'
import { SampleAccounts } from '@/features/auth/components/SampleAccounts'
import { errorMessage, fieldError } from '@/lib/api/error-message'
import type { StaffRole } from '@/lib/copy/labels'
import { useMockApi } from '@/lib/env'
import { formatPhoneDisplay } from '@/lib/phone/phone'
import { SAMPLE_CODE, SAMPLE_SECOND_FACTOR, STAFF_PHONES } from '@/mocks/sample-code'

type Step = { kind: 'phone' } | { kind: 'code'; phone: string } | { kind: 'second-factor' }

/**
 * Staff sign-in (PRD §3.5): phone, texted code, then a second code when the API asks for one. Once the
 * session starts, `RedirectIfStaff` moves on to `next`. Says nothing about what the console contains.
 */
export function SignInPage({ showSampleAccounts = useMockApi }: { showSampleAccounts?: boolean }) {
  const [step, setStep] = useState<Step>({ kind: 'phone' })
  const [pageError, setPageError] = useState<unknown>(null)
  const { request, verify, secondFactor } = useSignIn()

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

  async function verifyCode(phone: string, code: string) {
    setPageError(null)
    const { secondFactorRequired } = await verify.mutateAsync({ phone, code })
    if (secondFactorRequired) setStep({ kind: 'second-factor' })
  }

  async function signInAsSample(role: StaffRole) {
    setPageError(null)
    try {
      const phone = STAFF_PHONES[role]
      await request.mutateAsync(phone)
      const { secondFactorRequired } = await verify.mutateAsync({ phone, code: SAMPLE_CODE })
      if (secondFactorRequired) await secondFactor.mutateAsync(SAMPLE_SECOND_FACTOR)
    } catch (error) {
      setPageError(error)
    }
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
            }}
            onPageError={setPageError}
          />
        )}

        {showSampleAccounts && step.kind === 'phone' && <SampleAccounts onSignIn={signInAsSample} />}
      </div>
    </>
  )
}
