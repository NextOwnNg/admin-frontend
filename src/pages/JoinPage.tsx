import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@heroui/react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { Link, useNavigate } from 'react-router'
import { PageHead } from '@/components/seo/PageHead'
import { Banner } from '@/components/ui/Banner'
import { PasswordField } from '@/components/ui/PasswordField'
import { TableSkeleton } from '@/components/ui/States'
import { acceptInvite, getInvite, sessionQueryKey, signOut } from '@/features/auth/api/auth-api'
import { useSession } from '@/features/auth/api/useSession'
import { PasswordStrengthMeter } from '@/features/auth/components/PasswordStrengthMeter'
import { forgetInviteToken, takeInviteToken } from '@/features/auth/invite-token'
import { newPasswordFormSchema, type NewPasswordForm } from '@/features/auth/schemas'
import { setCsrfToken } from '@/lib/api/client'
import { errorMessage, fieldError, isNotFound } from '@/lib/api/error-message'
import type { InviteDetails } from '@/lib/api/types/auth'
import { AUTH_COPY } from '@/lib/copy/auth'
import { ROLE_LABELS } from '@/lib/copy/labels'
import { resetAllStores, useSessionStore } from '@/stores/session'

/**
 * Accept an invite (design 2026-11-21 §4.4): the link proves the email, so the invitee only sets a password and
 * is signed in. Public, and not behind `RedirectIfStaff`: someone already signed in is offered to sign out first.
 */
export function JoinPage() {
  const [token] = useState(takeInviteToken)
  // Once the account exists the session reads as staff: the new person must not be offered to sign out of it
  const [accepted, setAccepted] = useState(false)
  const session = useSession()
  const status = useSessionStore((s) => s.status)
  const signedInAs = useSessionStore((s) => s.displayName)

  const invite = useQuery({
    queryKey: ['invite', token],
    queryFn: ({ signal }) => getInvite(token!, { signal }),
    enabled: token !== null,
    retry: (count, error) => count < 2 && !isNotFound(error),
  })
  const refused = token === null || isNotFound(invite.error)
  if (refused) forgetInviteToken()

  return (
    <>
      <PageHead title="Join NextOwn Admin" />
      {accepted ? (
        <p role="status" className="text-body text-muted">
          Signing you in…
        </p>
      ) : refused ? (
        <NotWorking />
      ) : invite.isError ? (
        <Banner tone="error" title={errorMessage(invite.error, 'The invite didn’t load.')} />
      ) : !invite.data || status === 'unknown' || session.isPending ? (
        <TableSkeleton rows={3} columns={1} />
      ) : status === 'staff' ? (
        <SignedIn name={signedInAs ?? 'someone else'} />
      ) : (
        <CreateAccount token={token} invite={invite.data} onAccepted={() => setAccepted(true)} />
      )}
    </>
  )
}

function NotWorking() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-h2 text-ink">Invite link not working</h1>
      <p className="text-body text-muted">{AUTH_COPY.inviteInvalid}</p>
      <Link to="/sign-in" className="self-start text-compact font-semibold text-action underline underline-offset-2">
        Go to sign in
      </Link>
    </div>
  )
}

/** Someone is signed in in this browser: the invite is for another person, so end that session first */
function SignedIn({ name }: { name: string }) {
  const queryClient = useQueryClient()
  const [pending, setPending] = useState(false)
  const [failure, setFailure] = useState<unknown>(null)

  async function signOutAndContinue() {
    setPending(true)
    setFailure(null)
    try {
      await signOut()
      // Forget their data, but keep this page's own queries (the session check and the invite) in place
      queryClient.removeQueries({ predicate: (q) => q.queryKey[0] === 'admin' && q.queryKey[1] !== 'session' })
      resetAllStores()
      setCsrfToken(null)
      await queryClient.invalidateQueries({ queryKey: sessionQueryKey })
    } catch (error) {
      setFailure(error)
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-h2 text-ink">Join NextOwn Admin</h1>
      {failure !== null && <Banner tone="error" title={errorMessage(failure, 'You weren’t signed out.')} />}
      <p className="text-body text-ink">You're signed in as {name}.</p>
      <p className="text-body text-muted">This invite is for someone else. Sign out to accept it.</p>
      <Button isPending={pending} onPress={() => void signOutAndContinue()}>
        Sign out and continue
      </Button>
    </div>
  )
}

function CreateAccount({
  token,
  invite,
  onAccepted,
}: {
  token: string
  invite: InviteDetails
  onAccepted: () => void
}) {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const [failure, setFailure] = useState<unknown>(null)
  const {
    register,
    handleSubmit,
    setError,
    control,
    formState: { errors, isSubmitting },
  } = useForm<NewPasswordForm>({
    resolver: zodResolver(newPasswordFormSchema),
    defaultValues: { password: '', confirm: '' },
  })
  const password = useWatch({ control, name: 'password' })

  const submit = handleSubmit(async ({ password }) => {
    setFailure(null)
    try {
      await acceptInvite(token, { password })
      forgetInviteToken()
      onAccepted()
      await queryClient.invalidateQueries({ queryKey: sessionQueryKey })
      await navigate('/', { replace: true })
    } catch (error) {
      const problem = fieldError(error, 'password')
      if (problem) setError('password', { message: problem })
      else setFailure(error)
    }
  })

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-h2 text-ink">{`Join NextOwn Admin as ${ROLE_LABELS[invite.role]}`}</h1>
        <p className="text-body text-muted">Invited as {invite.email}</p>
      </div>
      {failure !== null && <Banner tone="error" title={errorMessage(failure, 'Your account wasn’t created.')} />}
      <form noValidate onSubmit={(e) => void submit(e)} className="flex flex-col gap-5">
        <PasswordField
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
          Create account
        </Button>
      </form>
    </div>
  )
}
