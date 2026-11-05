import { Link } from 'react-router'
import { MaskedValue } from '@/components/domain/MaskedValue'
import { Section } from '@/components/ui/Section'
import { useReveal } from '@/features/cases/api/useReveal'
import type { CaseDetail, PartyRef } from '@/lib/api/types/cases'
import { canAccess } from '@/lib/permissions/permissions'
import { formatWATDate } from '@/lib/time/time'
import { useSessionStore } from '@/stores/session'

const PARTY_ROLE: Record<PartyRef['role'], string> = {
  reporter: 'Reporter',
  reported: 'Reported member',
  participant_a: 'Participant A',
  participant_b: 'Participant B',
}

/** "3 previous moderation actions in 90 days": a fact, never a score (design §4.3) */
const priorActions = (n: number) => `${n} previous moderation ${n === 1 ? 'action' : 'actions'} in 90 days`

export function PartiesSection({ caseDetail }: { caseDetail: CaseDetail }) {
  const reveal = useReveal()
  // Member records are for moderators and administrators; a link others can't follow is a dead end
  const canBrowse = canAccess(
    'records',
    useSessionStore((s) => s.roles),
  )
  return (
    <Section title="Parties">
      <ul className="flex flex-col divide-y divide-border">
        {caseDetail.parties.map((party) => (
          <li key={party.userId} className="flex flex-col gap-1 py-3 first:pt-0 last:pb-0">
            <p className="flex flex-wrap items-baseline gap-x-2">
              {canBrowse ? (
                <Link
                  to={`/records/users/${party.userId}`}
                  className="font-semibold text-ink underline-offset-2 hover:underline"
                >
                  {party.displayName}
                </Link>
              ) : (
                <span className="font-semibold text-ink">{party.displayName}</span>
              )}
              <span className="text-compact text-muted">{PARTY_ROLE[party.role]}</span>
              <span className="text-compact text-muted">Member since {formatWATDate(party.memberSince)}</span>
            </p>
            {party.priorActions90d > 0 && (
              <p className="text-compact font-medium text-warning">{priorActions(party.priorActions90d)}</p>
            )}
            <div className="flex items-center gap-2 text-compact">
              <span className="text-muted">Phone</span>
              <MaskedValue
                label={`Phone number of ${party.displayName}`}
                reveal={async (reason) =>
                  (
                    await reveal({
                      scope: { kind: 'case', id: caseDetail.id },
                      field: 'phone',
                      subjectId: party.userId,
                      reason,
                    })
                  ).value ?? ''
                }
              />
            </div>
          </li>
        ))}
      </ul>
    </Section>
  )
}
