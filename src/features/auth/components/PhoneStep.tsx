import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@heroui/react'
import { useForm } from 'react-hook-form'
import { TextField } from '@/components/ui/TextField'
import { phoneSchema, type PhoneForm, type PhoneInput } from '@/features/auth/schemas'
import { fieldError } from '@/lib/api/error-message'

/** Step 1: the staff member's phone number. The server's own field message wins over ours. */
export function PhoneStep({ onSubmit }: { onSubmit: (phone: string) => Promise<void> }) {
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<PhoneInput, unknown, PhoneForm>({ resolver: zodResolver(phoneSchema), defaultValues: { phone: '' } })

  const submit = handleSubmit(async ({ phone }) => {
    try {
      await onSubmit(phone)
    } catch (error) {
      const message = fieldError(error, 'phone')
      if (message) setError('phone', { message })
    }
  })

  return (
    <form noValidate onSubmit={(e) => void submit(e)} className="flex flex-col gap-5">
      <TextField
        label="Phone number"
        type="tel"
        inputMode="tel"
        autoComplete="tel"
        hint="We'll text a 6-digit code to the number on your staff account."
        error={errors.phone?.message}
        {...register('phone')}
      />
      <Button type="submit" isPending={isSubmitting} fullWidth>
        Send code
      </Button>
    </form>
  )
}
