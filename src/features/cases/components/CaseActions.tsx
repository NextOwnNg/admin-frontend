import { useState } from 'react'
import { PlainButton } from '@/components/ui/Button'
import { ActionDialog } from '@/features/actions/components/ActionDialog'
import { actionsFor, type ActionDefinition } from '@/features/actions/definitions'
import type { AuditEntry } from '@/lib/api/types/audit'
import type { CaseDetail } from '@/lib/api/types/cases'
import { useSessionStore } from '@/stores/session'

/** The action that ends the case for this role stands out (design mockup: "Record decision") */
const DECISIONS = new Set(['close', 'propose'])

/** The actions this role may take on the case; each opens the reasoned, confirmed dialog (design §4.5). */
export function CaseActions({
  caseDetail,
  onRecorded,
}: {
  caseDetail: CaseDetail
  onRecorded: (entry: AuditEntry) => void
}) {
  const roles = useSessionStore((s) => s.roles)
  const context = { kind: 'case' as const, caseDetail }
  const actions = actionsFor(roles, context)
  const [open, setOpen] = useState<ActionDefinition | null>(null)

  // An open dialog outlives its action: another operator may close the case meanwhile (ADM-T-05)
  if (actions.length === 0 && !open) return null
  return (
    <>
      {actions.length > 0 && (
        <div role="group" aria-label="Actions" className="flex flex-col gap-2">
          {actions.map((action) => (
            <PlainButton
              key={action.id}
              fullWidth
              variant={action.destructive ? 'danger-soft' : DECISIONS.has(action.id) ? 'primary' : 'secondary'}
              onClick={() => setOpen(action)}
            >
              {action.label}
            </PlainButton>
          ))}
        </div>
      )}
      {open && (
        <ActionDialog
          definition={open}
          context={context}
          open
          onOpenChange={(next) => !next && setOpen(null)}
          onDone={onRecorded}
        />
      )}
    </>
  )
}
