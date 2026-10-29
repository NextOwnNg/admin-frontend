import { Button, Modal } from '@heroui/react'
import { useRef, useState } from 'react'

type ConfirmModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  /** Who is acting, e.g. "Tunde Bakare (moderator)" */
  actor: string
  /** Who or what is affected */
  target: string
  /** What will happen, in a sentence */
  consequence: string
  /** The chosen reason code's label, when the action needs one */
  reason?: string
  confirmLabel: string
  cancelLabel?: string
  tone: 'standard' | 'destructive'
  /** Resolve to close; throw to keep the modal open (the caller shows the error). */
  onConfirm: () => Promise<void> | void
}

/**
 * Explicit confirmation for privileged actions: names actor, target, consequence and reason (PRD §4.7)
 * and never fires twice.
 */
export function ConfirmModal({
  open,
  onOpenChange,
  title,
  actor,
  target,
  consequence,
  reason,
  confirmLabel,
  cancelLabel = 'Cancel',
  tone,
  onConfirm,
}: ConfirmModalProps) {
  const [pending, setPending] = useState(false)
  const inFlight = useRef(false)

  async function confirm() {
    if (inFlight.current) return
    inFlight.current = true
    setPending(true)
    try {
      await onConfirm()
      onOpenChange(false)
    } catch {
      // Caller surfaces the error; keep the dialog open so nothing is lost.
    } finally {
      inFlight.current = false
      setPending(false)
    }
  }

  const facts: [string, string][] = [
    ['Action by', actor],
    ['Affects', target],
    ['What happens', consequence],
  ]
  if (reason) facts.push(['Reason', reason])

  return (
    <Modal isOpen={open} onOpenChange={(next) => !pending && onOpenChange(next)}>
      <Modal.Backdrop isDismissable={!pending}>
        <Modal.Container size="md" className="max-w-160">
          <Modal.Dialog className="rounded-card">
            <Modal.Header>
              <Modal.Heading className="text-h3 text-ink">{title}</Modal.Heading>
            </Modal.Header>
            <Modal.Body>
              <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-body">
                {facts.map(([term, value]) => (
                  <div key={term} className="contents">
                    <dt className="text-muted">{term}</dt>
                    <dd className="text-ink">{value}</dd>
                  </div>
                ))}
              </dl>
            </Modal.Body>
            <Modal.Footer className="flex justify-end gap-2">
              <Button variant="tertiary" slot="close" isDisabled={pending}>
                {cancelLabel}
              </Button>
              <Button variant={tone === 'destructive' ? 'danger' : 'primary'} isPending={pending} onPress={confirm}>
                {confirmLabel}
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  )
}
