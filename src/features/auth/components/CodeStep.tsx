import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@heroui/react'
import { useForm } from 'react-hook-form'
import { TextField } from '@/components/ui/TextField'
import { codeSchema, type CodeForm } from '@/features/auth/schemas'
import { toApiError } from '@/lib/api/api-error'
import { errorMessage } from '@/lib/api/error-message'

/** Codes whose message belongs on the code field; anything else is the page's banner. */
const CODE_PROBLEMS = new Set(['OTP_INVALID', 'OTP_EXPIRED', 'VALIDATION_ERROR'])

/** A 6-digit code step, used for the texted code and the administrator's second code. */
export function CodeStep({
  heading,
  intro,
  label,
  submitLabel,
  onSubmit,
  onPageError,
  secondary,
}: {
  heading: string
  intro: string
  label: string
  submitLabel: string
  onSubmit: (code: string) => Promise<void>
  onPageError: (error: unknown) => void
  secondary?: React.ReactNode
}) {
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<CodeForm>({ resolver: zodResolver(codeSchema), defaultValues: { code: '' } })

  const submit = handleSubmit(async ({ code }) => {
    try {
      await onSubmit(code)
    } catch (error) {
      if (CODE_PROBLEMS.has(toApiError(error).code)) setError('code', { message: errorMessage(error) })
      else onPageError(error)
    }
  })

  return (
    <form noValidate onSubmit={(e) => void submit(e)} className="flex flex-col gap-5">
      <div className="flex flex-col gap-1">
        <h2 className="text-h3 text-ink">{heading}</h2>
        <p className="text-body text-muted">{intro}</p>
      </div>
      <TextField
        label={label}
        inputMode="numeric"
        autoComplete="one-time-code"
        maxLength={6}
        className="tabular tracking-widest"
        error={errors.code?.message}
        {...register('code')}
      />
      <Button type="submit" isPending={isSubmitting} fullWidth>
        {submitLabel}
      </Button>
      {secondary}
    </form>
  )
}
