import { Button, Modal } from '@heroui/react'

/** Idle warning (PRD §3.5): not dismissable by Escape or a click outside; only the button keeps the session. */
export function IdleTimeoutModal({
  open,
  secondsLeft,
  onStay,
}: {
  open: boolean
  secondsLeft: number
  onStay: () => void
}) {
  return (
    <Modal isOpen={open} onOpenChange={() => {}}>
      <Modal.Backdrop isDismissable={false} isKeyboardDismissDisabled>
        <Modal.Container size="sm">
          <Modal.Dialog className="rounded-card">
            <Modal.Header>
              <Modal.Heading className="text-h3 text-ink">You&apos;ll be signed out soon</Modal.Heading>
            </Modal.Header>
            <Modal.Body className="flex flex-col gap-3 text-body text-muted">
              <p>For security, we sign you out after a period of inactivity. Save any notes you&apos;re writing.</p>
              <p className="tabular font-semibold text-ink">Signing out in {secondsLeft} s</p>
            </Modal.Body>
            <Modal.Footer className="flex justify-end">
              <Button onPress={onStay}>Stay signed in</Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  )
}
