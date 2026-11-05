import { Timeline } from '@/components/data/Timeline'
import { AuditEntry } from '@/components/domain/AuditEntry'
import { Section } from '@/components/ui/Section'
import type { AuditEntry as AuditEntryData } from '@/lib/api/types/audit'

/** Audit entries newest first, read-only (design §4.3). */
export function HistorySection({ entries, title = 'History' }: { entries: AuditEntryData[]; title?: string }) {
  return (
    <Section title={title}>
      {entries.length === 0 ? (
        <p className="text-compact text-muted">Nothing recorded yet.</p>
      ) : (
        <Timeline label={title}>
          {entries.map((entry) => (
            <li key={entry.id}>
              <AuditEntry entry={entry} />
            </li>
          ))}
        </Timeline>
      )}
    </Section>
  )
}
