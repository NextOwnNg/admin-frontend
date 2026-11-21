import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@heroui/react'
import type { ReactNode } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { PasswordField } from '@/components/ui/PasswordField'
import { TextField } from '@/components/ui/TextField'
import { PasswordStrengthMeter } from '@/features/auth/components/PasswordStrengthMeter'
import { resetFormSchema, type ResetForm } from '@/features/auth/schemas'
import { toApiError } from '@/lib/api/api-error'
import { errorMessage, fieldError } from '@/lib/api/error-message'

const CODE_PROBLEMS = new Set(['OTP_INVALID', 'OTP_EXPIRED'])

/** The emailed code and a new password, typed twice. A wrong code stays on the code field; the rest is kept. */
export function ResetStep({
  intro,
  onSubmit,
  onPageError,
  resend,
  secondary,
}: {
  intro: string
  onSubmit: (values: ResetForm) => Promise<void>
  onPageError: (error: unknown) => void
  resend: ReactNode
  secondary: ReactNode
}) {
  const {
    register,
    handleSubmit,
    setError,
    control,
    formState: { errors, isSubmitting },
  } = useForm<ResetForm>({
    resolver: zodResolver(resetFormSchema),
    defaultValues: { code: '', password: '', confirm: '' },
  })

  const password = useWatch({ control, name: 'password' })

  const submit = handleSubmit(async (values) => {
    try {
      await onSubmit(values)
    } catch (error) {
      const passwordProblem = fieldError(error, 'password')
      if (CODE_PROBLEMS.has(toApiError(error).code)) setError('code', { message: errorMessage(error) })
      else if (passwordProblem) setError('password', { message: passwordProblem })
      else onPageError(error)
    }
  })

  return (
    <form noValidate onSubmit={(e) => void submit(e)} className="flex flex-col gap-5">
      <div className="flex flex-col gap-1">
        <h2 className="text-h3 text-ink">Choose a new password</h2>
        <p className="text-body text-muted">{intro}</p>
      </div>
      <TextField
        label="6-digit code"
        inputMode="numeric"
        autoComplete="one-time-code"
        maxLength={6}
        className="tabular tracking-widest"
        error={errors.code?.message}
        {...register('code')}
      />
      {resend}
      <PasswordField
        label="New password"
        autoComplete="new-password"
        error={errors.password?.message}
        hint={<PasswordStrengthMeter password={password} />}
        {...register('password')}
      />
      <PasswordField
        label="Confirm password"
        autoComplete="new-password"
        error={errors.confirm?.message}
        {...register('confirm')}
      />
      <Button type="submit" isPending={isSubmitting} fullWidth>
        Reset password
      </Button>
      {secondary}
    </form>
  )
}
