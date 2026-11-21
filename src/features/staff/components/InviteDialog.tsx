import { zodResolver } from '@hookform/resolvers/zod'
import { Button, Modal } from '@heroui/react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Banner } from '@/components/ui/Banner'
import { ConfirmModal } from '@/components/ui/ConfirmModal'
import { SelectField } from '@/components/ui/SelectField'
import { TextField } from '@/components/ui/TextField'
import { useInvite } from '@/features/staff/api/useStaffAccounts'
import { ReasonField } from '@/features/staff/components/ReasonField'
import { inviteFormSchema, type InviteForm, type InviteInput } from '@/features/staff/schemas'
import { errorMessage, fieldErrorsOf } from '@/lib/api/error-message'
import { newIdempotencyKey } from '@/lib/api/idempotency'
import type { InviteResult } from '@/lib/api/types/staff'
import { ROLE_LABELS, STAFF_ROLES } from '@/lib/copy/labels'

const ROLE_OPTIONS = STAFF_ROLES.map((role) => ({ value: role, label: ROLE_LABELS[role] }))
const FORM_FIELDS = new Set(['displayName', 'email', 'role', 'reason'])

/**
 * Invite someone (design 2026-11-21 §4.3): name, email, one role and a reason, then an explicit confirmation.
 * One Idempotency-Key per opening, reused if the operator tries again. Mount it only while open.
 */
export function InviteDialog({
  actor,
  onOpenChange,
  onSent,
}: {
  actor: string
  onOpenChange: (open: boolean) => void
  onSent: (result: InviteResult) => void
}) {
  const [key] = useState(newIdempotencyKey)
  const [confirming, setConfirming] = useState<InviteForm | null>(null)
  const [failure, setFailure] = useState<unknown>(null)
  const invite = useInvite()
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<InviteInput, unknown, InviteForm>({
    resolver: zodResolver(inviteFormSchema),
    defaultValues: { displayName: '', email: '', role: '', reason: '' },
  })

  async function send(values: InviteForm) {
    setFailure(null)
    try {
      onSent(await invite.mutateAsync({ body: values, key }))
      onOpenChange(false)
    } catch (error) {
      // The server's own field messages go under their fields; anything else above the form
      const fields = Object.entries(fieldErrorsOf(error) ?? {}).filter(([name]) => FORM_FIELDS.has(name))
      if (fields.length > 0) {
        for (const [name, message] of fields) setError(name as keyof InviteInput, { message })
      } else {
        setFailure(error)
      }
    }
  }

  return (
    <>
      <Modal isOpen onOpenChange={onOpenChange}>
        <Modal.Backdrop>
          <Modal.Container size="md" className="max-w-140">
            <Modal.Dialog className="rounded-card">
              <form noValidate onSubmit={(e) => void handleSubmit(setConfirming)(e)}>
                <Modal.Header>
                  <Modal.Heading className="text-h3 text-ink">Invite staff</Modal.Heading>
                </Modal.Header>
                <Modal.Body className="flex flex-col gap-4">
                  <p className="text-body text-muted">
                    They get an email with a link to set a password. The link works for 7 days.
                  </p>
                  {failure !== null && <Banner tone="error" title={errorMessage(failure, 'The invite wasn’t sent.')} />}
                  <TextField
                    label="Name"
                    autoComplete="off"
                    error={errors.displayName?.message}
                    {...register('displayName')}
                  />
                  <TextField
                    label="Email"
                    type="email"
                    autoComplete="off"
                    autoCapitalize="none"
                    spellCheck={false}
                    error={errors.email?.message}
                    {...register('email')}
                  />
                  <SelectField
                    label="Role"
                    placeholder="Choose a role"
                    options={ROLE_OPTIONS}
                    error={errors.role?.message}
                    {...register('role')}
                  />
                  <ReasonField
                    label="Why are you adding them?"
                    error={errors.reason?.message}
                    {...register('reason')}
                  />
                </Modal.Body>
                <Modal.Footer className="flex justify-end gap-2">
                  <Button variant="tertiary" slot="close">
                    Cancel
                  </Button>
                  <Button type="submit">Continue</Button>
                </Modal.Footer>
              </form>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>
      {confirming && (
        <ConfirmModal
          open
          onOpenChange={(next) => !next && setConfirming(null)}
          title={`Invite ${confirming.displayName}?`}
          actor={actor}
          target={`${confirming.displayName} (${confirming.email})`}
          consequence={`They're emailed a link to join as ${ROLE_LABELS[confirming.role]}. It works for 7 days.`}
          reason={confirming.reason}
          confirmLabel="Send invite"
          tone="standard"
          onConfirm={() => send(confirming)}
        />
      )}
    </>
  )
}
