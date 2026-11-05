import { useState } from 'react'
import { Link } from 'react-router'
import { KeyValueList } from '@/components/data/KeyValueList'
import { MaskedValue } from '@/components/domain/MaskedValue'
import { TransactionStatusBadge } from '@/components/domain/TransactionStatusBadge'
import { PlainButton } from '@/components/ui/Button'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { ActionDialog } from '@/features/actions/components/ActionDialog'
import { actionsFor, type ActionDefinition, type ActionValues } from '@/features/actions/definitions'
import { useReveal } from '@/features/cases/api/useReveal'
import type { AuditEntry } from '@/lib/api/types/audit'
import type { TransactionDetail } from '@/lib/api/types/transactions'
import { TRANSACTION_FLAG } from '@/lib/copy/status'
import { useSessionStore } from '@/stores/session'

/**
 * Status, exception flags, linked cases, the private venue and, for administrators, resolution and
 * item release (design §4.4, §9a.1). Nothing here confirms for a participant.
 */
export function TransactionPanel({
  tx,
  caseId,
  onRecorded,
}: {
  tx: TransactionDetail
  caseId?: string
  onRecorded: (entry: AuditEntry) => void
}) {
  const roles = useSessionStore((s) => s.roles)
  const reveal = useReveal()
  const context = { kind: 'transaction' as const, tx, caseId }
  const actions = actionsFor(roles, context)
  const [open, setOpen] = useState<{ definition: ActionDefinition; initial?: Partial<ActionValues> } | null>(null)
  const releasable = tx.reservations.filter((r) => r.releasable && !r.releasedAt)

  return (
    <section
      aria-label="Transaction status"
      className="flex flex-col gap-4 rounded-card border border-border bg-paper p-5"
    >
      <KeyValueList
        items={[
          { term: 'Status', value: <TransactionStatusBadge status={tx.status} /> },
          ...(tx.flags.length > 0
            ? [
                {
                  term: 'Flags',
                  value: (
                    <span className="flex flex-wrap gap-1.5">
                      {tx.flags.map((f) => (
                        <StatusBadge
                          key={f}
                          {...TRANSACTION_FLAG[f]}
                          className="h-auto py-0.5 [&>span]:whitespace-normal"
                        />
                      ))}
                    </span>
                  ),
                },
              ]
            : []),
          {
            term: tx.caseIds.length === 1 ? 'Case' : 'Cases',
            value: (
              <span className="flex flex-col">
                {tx.caseIds.map((id) => (
                  <Link
                    key={id}
                    to={`/cases/${id}`}
                    className="font-medium text-action tabular-nums underline underline-offset-2"
                  >
                    Case {id}
                  </Link>
                ))}
              </span>
            ),
          },
          {
            term: 'Handover venue',
            value: (
              <MaskedValue
                label="Handover venue"
                reveal={async (reason) =>
                  (await reveal({ scope: { kind: 'transaction', id: tx.id, caseId }, field: 'venue', reason })).value ??
                  ''
                }
              />
            ),
          },
        ]}
      />

      {actions.length > 0 && (
        <div role="group" aria-label="Actions" className="flex flex-col gap-2">
          {actions.map((definition) =>
            definition.id === 'release' ? (
              releasable.map((r) => (
                <PlainButton
                  key={r.itemId}
                  fullWidth
                  variant="secondary"
                  onClick={() => setOpen({ definition, initial: { itemId: r.itemId } })}
                >
                  Release {r.itemTitle}
                </PlainButton>
              ))
            ) : (
              <PlainButton key={definition.id} fullWidth onClick={() => setOpen({ definition })}>
                {definition.label}
              </PlainButton>
            ),
          )}
        </div>
      )}

      {open && (
        <ActionDialog
          definition={open.definition}
          context={context}
          initial={open.initial}
          open
          onOpenChange={(next) => !next && setOpen(null)}
          onDone={onRecorded}
        />
      )}
    </section>
  )
}
