import { Button, Modal } from '@heroui/react'
import { useState } from 'react'
import { Field } from '@/components/ui/Field'

export const MIN_REVEAL_REASON = 10

/**
 * Asks why before showing masked data or evidence (PRD §7, ADM-T-02). The reason is logged with the view.
 * Resolve `onSubmit` to close; reject with a message to keep the dialog open and show it.
 */
export function RevealReasonDialog({
  open,
  onOpenChange,
  title,
  onSubmit,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  onSubmit: (reason: string) => Promise<void>
}) {
  const [reason, setReason] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)
  const ready = reason.trim().length >= MIN_REVEAL_REASON

  async function submit() {
    setPending(true)
    setError(null)
    try {
      await onSubmit(reason.trim())
      onOpenChange(false)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setPending(false)
    }
  }

  return (
    <Modal isOpen={open} onOpenChange={(next) => !pending && onOpenChange(next)}>
      <Modal.Backdrop isDismissable={!pending}>
        <Modal.Container size="md" className="max-w-160">
          <Modal.Dialog className="rounded-card">
            <Modal.Header>
              <Modal.Heading className="text-h3 text-ink">{title}</Modal.Heading>
            </Modal.Header>
            <Modal.Body className="flex flex-col gap-3">
              <p className="text-body text-muted">Your reason is saved in the moderation log with this view.</p>
              <Field
                label="Why do you need to see this?"
                hint={`At least ${MIN_REVEAL_REASON} characters.`}
                error={error}
              >
                {({ inputId, describedBy, invalid }) => (
                  <textarea
                    id={inputId}
                    aria-describedby={describedBy}
                    aria-invalid={invalid || undefined}
                    rows={3}
                    maxLength={500}
                    className="field-input min-h-24 py-3"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                  />
                )}
              </Field>
            </Modal.Body>
            <Modal.Footer className="flex justify-end gap-2">
              <Button variant="tertiary" slot="close" isDisabled={pending}>
                Cancel
              </Button>
              <Button isDisabled={!ready} isPending={pending} onPress={() => void submit()}>
                Reveal
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  )
}
