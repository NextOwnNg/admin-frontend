import { Button, Modal } from '@heroui/react'
import { useState } from 'react'
import { PlainButton } from '@/components/ui/Button'
import { SelectField } from '@/components/ui/SelectField'
import { useStaff } from '@/lib/api/reference'
import type { CaseSummary } from '@/lib/api/types/cases'
import { ROLE_LABELS } from '@/lib/copy/labels'
import { useSessionStore } from '@/stores/session'

/** Pick a colleague for a case (design §9a.5). */
export function AssignDialog({
  caseId,
  currentAssigneeId,
  open,
  onOpenChange,
  onAssign,
}: {
  caseId: string
  currentAssigneeId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onAssign: (staffId: string) => void
}) {
  const staff = useStaff()
  const [choice, setChoice] = useState('')
  const options = (staff.data ?? [])
    .filter((s) => s.staffId !== currentAssigneeId)
    .map((s) => ({ value: s.staffId, label: s.displayName }))

  return (
    <Modal isOpen={open} onOpenChange={onOpenChange}>
      <Modal.Backdrop>
        <Modal.Container size="sm" className="max-w-120">
          <Modal.Dialog className="rounded-card">
            <Modal.Header>
              <Modal.Heading className="text-h3 text-ink">{`Assign case ${caseId}`}</Modal.Heading>
            </Modal.Header>
            <Modal.Body>
              <SelectField
                label="Assign to"
                placeholder="Choose a person"
                options={options}
                value={choice}
                onChange={(e) => setChoice(e.target.value)}
                hint={staff.data ? undefined : 'Loading staff…'}
              />
            </Modal.Body>
            <Modal.Footer className="flex justify-end gap-2">
              <Button variant="tertiary" slot="close">
                Cancel
              </Button>
              <Button
                isDisabled={!choice}
                onPress={() => {
                  onAssign(choice)
                  onOpenChange(false)
                }}
              >
                Assign
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  )
}

/** Who has the case, and for moderators and administrators, a way to change it. */
export function AssignControl({
  caseSummary,
  onAssign,
  pending = false,
}: {
  caseSummary: Pick<CaseSummary, 'id' | 'assignee' | 'status'>
  onAssign: (staffId: string | null) => void
  pending?: boolean
}) {
  const { staffId, roles } = useSessionStore()
  const [open, setOpen] = useState(false)
  const canAssign =
    roles.some((r) => r !== 'support_agent') && caseSummary.status !== 'closed' && caseSummary.status !== 'resolved'
  const { assignee } = caseSummary

  return (
    <div className="flex flex-col gap-2">
      <p className="text-body text-ink">
        {assignee ? (
          <>
            {assignee.displayName}
            <span className="text-muted"> · {assignee.roles.map((r) => ROLE_LABELS[r]).join(', ')}</span>
          </>
        ) : (
          <span className="text-muted">Unassigned</span>
        )}
      </p>
      {canAssign && (
        <div className="flex flex-wrap gap-2">
          {assignee?.staffId !== staffId && staffId && (
            <PlainButton size="compact" variant="secondary" disabled={pending} onClick={() => onAssign(staffId)}>
              Assign to me
            </PlainButton>
          )}
          <PlainButton size="compact" variant="ghost" disabled={pending} onClick={() => setOpen(true)}>
            Assign to…
          </PlainButton>
          {assignee && (
            <PlainButton size="compact" variant="ghost" disabled={pending} onClick={() => onAssign(null)}>
              Unassign
            </PlainButton>
          )}
        </div>
      )}
      <AssignDialog
        caseId={caseSummary.id}
        currentAssigneeId={assignee?.staffId ?? null}
        open={open}
        onOpenChange={setOpen}
        onAssign={onAssign}
      />
    </div>
  )
}
