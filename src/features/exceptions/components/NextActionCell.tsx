import { ButtonLink, PlainButton } from '@/components/ui/Button'
import type { ExceptionRow } from '@/lib/api/types/exceptions'

/**
 * The row's next action (ADM-FE-08: never a dead end). A support agent takes an unassigned row first:
 * once it is theirs, the case and its transaction open for them.
 */
export function NextActionCell({
  row,
  mustAssign,
  heldBy,
  pending,
  onAssign,
}: {
  row: ExceptionRow
  mustAssign: boolean
  /** Someone else has it: the next step is theirs, and it isn't ours to take over */
  heldBy: string | null
  pending: boolean
  onAssign: () => void
}) {
  return (
    <div className="flex flex-col items-start gap-1">
      {heldBy ? (
        <p className="text-compact text-ink">{heldBy} has this</p>
      ) : mustAssign ? (
        <PlainButton size="compact" variant="secondary" disabled={pending} onClick={onAssign}>
          Assign to me <span className="sr-only">for {row.caseId}</span>
        </PlainButton>
      ) : (
        <ButtonLink to={row.nextAction.href} size="compact" className="whitespace-nowrap">
          {row.nextAction.label} <span className="sr-only">for {row.caseId}</span>
        </ButtonLink>
      )}
      {row.nextAction.note && <p className="text-caption text-muted">{row.nextAction.note}</p>}
    </div>
  )
}
