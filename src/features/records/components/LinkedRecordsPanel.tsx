import { useId } from 'react'
import { Section } from '@/components/ui/Section'
import { RecordLink } from '@/features/records/components/RecordLink'
import type { RecordLinkGroup } from '@/lib/api/types/records'

/** The record's neighbours along member → item → listing → offer → transaction → case (ADM-FE-07) */
export function LinkedRecordsPanel({ groups }: { groups: RecordLinkGroup[] }) {
  const shown = groups.filter((g) => g.records.length > 0)
  return (
    <Section title="Linked records">
      {shown.length === 0 ? (
        <p className="text-compact text-muted">Nothing linked yet</p>
      ) : (
        <div className="flex flex-col gap-4">
          {shown.map((g) => (
            <LinkGroup key={g.label} group={g} />
          ))}
        </div>
      )}
    </Section>
  )
}

function LinkGroup({ group }: { group: RecordLinkGroup }) {
  const id = useId()
  return (
    <div className="flex flex-col gap-1.5">
      <h3 id={id} className="text-caption font-semibold text-muted">
        {group.label}
      </h3>
      <ul aria-labelledby={id} className="flex flex-col gap-1 text-compact">
        {group.records.map((r) => (
          <li key={`${r.kind}-${r.id}`}>
            <RecordLink record={r} />
          </li>
        ))}
      </ul>
    </div>
  )
}
