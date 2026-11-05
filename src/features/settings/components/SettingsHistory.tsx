import { Section } from '@/components/ui/Section'
import { ErrorState, TableSkeleton } from '@/components/ui/States'
import { useSettingsHistory } from '@/features/settings/api/useSettings'
import { changeLines } from '@/features/settings/changes'
import { SECTION_LABELS } from '@/features/settings/schemas'
import type { PilotSettings } from '@/lib/api/types/settings'
import { formatUTC, formatWAT } from '@/lib/time/time'

/** Every saved version, newest first: who, when, why and what changed */
export function SettingsHistory() {
  const history = useSettingsHistory()
  return (
    <Section title="History">
      {history.isPending ? (
        <TableSkeleton rows={3} columns={1} />
      ) : history.isError ? (
        <ErrorState onRetry={() => void history.refetch()} />
      ) : history.data.length === 0 ? (
        <p className="text-compact text-muted">No changes since the pilot settings were set up.</p>
      ) : (
        <ol className="flex flex-col divide-y divide-border">
          {history.data.map((v) => (
            <li key={v.version} className="flex flex-col gap-1 py-3 text-compact first:pt-0 last:pb-0">
              <p className="font-semibold text-ink tabular-nums">
                Version {v.version} · {SECTION_LABELS[v.section]} · {v.by} ·{' '}
                <span title={formatUTC(v.at)}>{formatWAT(v.at)}</span>
              </p>
              <p className="text-muted">{v.reason}</p>
              <ul className="flex flex-col text-ink">
                {changeLines(
                  v.section,
                  v.before as PilotSettings[typeof v.section],
                  v.after as PilotSettings[typeof v.section],
                ).map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            </li>
          ))}
        </ol>
      )}
    </Section>
  )
}
