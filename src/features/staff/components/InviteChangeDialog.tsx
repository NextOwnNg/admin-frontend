import { Button, Modal } from '@heroui/react'
import { useState } from 'react'
import { Banner } from '@/components/ui/Banner'
import { ConfirmModal } from '@/components/ui/ConfirmModal'
import { useResendInvite, useRevokeInvite } from '@/features/staff/api/useStaffAccounts'
import { ReasonField } from '@/features/staff/components/ReasonField'
import { reasonSchema } from '@/features/staff/schemas'
import { errorMessage } from '@/lib/api/error-message'
import { newIdempotencyKey } from '@/lib/api/idempotency'
import type { InviteResult, StaffAccountRow } from '@/lib/api/types/staff'
import { STAFF_COPY } from '@/lib/copy/staff'

type Change = 'resend' | 'revoke'

const COPY: Record<
  Change,
  { title: (name: string) => string; label: string; required: string; confirm: string; consequence: string }
> = {
  resend: {
    title: (name) => `Resend the invite to ${name}`,
    label: 'Why are you resending it?',
    required: STAFF_COPY.resendReasonRequired,
    confirm: 'Resend invite',
    consequence: 'A new link is emailed and works for 7 days. The old link stops working.',
  },
  revoke: {
    title: (name) => `Revoke the invite for ${name}`,
    label: 'Why are you revoking it?',
    required: STAFF_COPY.revokeReasonRequired,
    confirm: 'Revoke invite',
    consequence: 'The invite link stops working. They can only join with a new invite.',
  },
}

/** Resend or revoke an invite: a reason, then an explicit confirmation. Mount it only while open. */
export function InviteChangeDialog({
  change,
  row,
  actor,
  onOpenChange,
  onDone,
}: {
  change: Change
  row: StaffAccountRow
  actor: string
  onOpenChange: (open: boolean) => void
  /** The resend answer (a new link); nothing for a revoke */
  onDone: (result: InviteResult | null) => void
}) {
  const copy = COPY[change]
  const [key] = useState(newIdempotencyKey)
  const [reason, setReason] = useState('')
  const [reasonError, setReasonError] = useState<string | undefined>()
  const [confirming, setConfirming] = useState(false)
  const [failure, setFailure] = useState<unknown>(null)
  const resend = useResendInvite()
  const revoke = useRevokeInvite()

  function next() {
    const checked = reasonSchema(copy.required).safeParse(reason)
    if (!checked.success) return setReasonError(checked.error.issues[0]?.message)
    setReasonError(undefined)
    setConfirming(true)
  }

  async function apply() {
    setFailure(null)
    const input = { inviteId: row.inviteId!, reason: reason.trim(), key }
    try {
      if (change === 'resend') onDone(await resend.mutateAsync(input))
      else {
        await revoke.mutateAsync(input)
        onDone(null)
      }
      onOpenChange(false)
    } catch (error) {
      setFailure(error)
    }
  }

  return (
    <>
      <Modal isOpen onOpenChange={onOpenChange}>
        <Modal.Backdrop>
          <Modal.Container size="sm" className="max-w-120">
            <Modal.Dialog className="rounded-card">
              <form
                noValidate
                onSubmit={(e) => {
                  e.preventDefault()
                  next()
                }}
              >
                <Modal.Header>
                  <Modal.Heading className="text-h3 text-ink">{copy.title(row.displayName)}</Modal.Heading>
                </Modal.Header>
                <Modal.Body className="flex flex-col gap-4">
                  {failure !== null && <Banner tone="error" title={errorMessage(failure, 'Nothing was changed.')} />}
                  <ReasonField
                    label={copy.label}
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    error={reasonError}
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
          onOpenChange={setConfirming}
          title={`${copy.title(row.displayName)}?`}
          actor={actor}
          target={`${row.displayName} (${row.email})`}
          consequence={copy.consequence}
          reason={reason.trim()}
          confirmLabel={copy.confirm}
          tone={change === 'revoke' ? 'destructive' : 'standard'}
          onConfirm={apply}
        />
      )}
    </>
  )
}
