import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@heroui/react'
import { useForm } from 'react-hook-form'
import { Link } from 'react-router'
import { PasswordField } from '@/components/ui/PasswordField'
import { TextField } from '@/components/ui/TextField'
import { signInSchema, type SignInForm, type SignInInput } from '@/features/auth/schemas'

/** Email and password. The answer to a wrong password is the page's banner, never a field (it names neither). */
export function CredentialsStep({
  onSubmit,
  forgotHref,
}: {
  onSubmit: (values: SignInForm) => Promise<void>
  forgotHref: string
}) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignInInput, unknown, SignInForm>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: '', password: '' },
  })

  return (
    <form noValidate onSubmit={(e) => void handleSubmit(onSubmit)(e)} className="flex flex-col gap-5">
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
      <div className="flex flex-col gap-2">
        <PasswordField autoComplete="current-password" error={errors.password?.message} {...register('password')} />
        <Link
          to={forgotHref}
          className="self-start text-compact font-semibold text-action underline underline-offset-2"
        >
          Forgot password?
        </Link>
      </div>
      <Button type="submit" isPending={isSubmitting} fullWidth>
        Sign in
      </Button>
    </form>
  )
}
