import { useState } from 'react'
import { KeyValueList } from '@/components/data/KeyValueList'
import { changeLines } from '@/features/settings/changes'
import { SETTINGS_SECTIONS } from '@/features/settings/schemas'
import type { SettingsSection } from '@/lib/api/types/settings'
import { useReasonLabel } from '@/lib/api/reference'
import type { AuditEntry as AuditEntryData } from '@/lib/api/types/audit'
import { auditSentence } from '@/lib/copy/audit'
import { formatUTC, formatWAT } from '@/lib/time/time'

const show = (value: unknown): string => {
  if (value === null || value === undefined) return 'None'
  if (typeof value === 'string') return value
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  return JSON.stringify(value)
}

const termOf = (key: string) => {
  const words = key.replace(/([A-Z])/g, ' $1').replaceAll('_', ' ')
  return words.charAt(0).toUpperCase() + words.slice(1).toLowerCase()
}

function Changes({ title, values }: { title: string; values: Record<string, unknown> | null }) {
  if (!values || Object.keys(values).length === 0) return null
  return (
    <div className="flex flex-col gap-1">
      <p className="text-caption text-muted">{title}</p>
      <KeyValueList items={Object.entries(values).map(([key, value]) => ({ term: termOf(key), value: show(value) }))} />
    </div>
  )
}

/** One audit entry, read-only (design §4.6): a sentence, the reason, WAT and exact UTC; details on request. */
export function AuditEntry({ entry }: { entry: AuditEntryData }) {
  const reason = useReasonLabel(entry.reasonCode)
  return (
    <div className="flex flex-col gap-1">
      <p className="text-compact text-ink">
        {auditSentence(entry)}
        {reason && <span className="text-muted"> · {reason}</span>}
      </p>
      <p className="flex flex-wrap gap-x-2 text-caption text-muted tabular-nums">
        <time dateTime={entry.at}>{formatWAT(entry.at)}</time>
        <span>{formatUTC(entry.at)}</span>
      </p>
      <AuditChanges entry={entry} />
    </div>
  )
}

/** The note and before/after values behind a disclosure; nothing when the entry has none. */
export function AuditChanges({ entry }: { entry: AuditEntryData }) {
  const [open, setOpen] = useState(false)
  const hasDetails = Boolean(entry.before || entry.after || entry.note)
  // A settings change reads as old → new lines, the same as its confirmation, not as raw values
  const section = entry.action === 'update_settings' ? (entry.target.id as SettingsSection) : null
  const settingsLines =
    section &&
    SETTINGS_SECTIONS.includes(section) &&
    entry.before?.[section] !== undefined &&
    entry.after?.[section] !== undefined
      ? changeLines(section, entry.before[section] as never, entry.after[section] as never)
      : null
  return (
    <>
      {hasDetails && (
        <>
          <button
            type="button"
            aria-expanded={open}
            onClick={() => setOpen(!open)}
            className="self-start text-caption font-semibold text-action underline-offset-2 hover:underline"
          >
            {open ? 'Hide details' : 'Show details'}
          </button>
          {open && (
            <div className="flex flex-col gap-2 rounded-small bg-cloud p-3">
              {entry.note && (
                <p className="text-compact whitespace-pre-wrap text-ink">
                  <span className="text-muted">Note: </span>
                  {entry.note}
                </p>
              )}
              {settingsLines ? (
                <ul className="flex flex-col gap-1 text-compact text-ink">
                  {settingsLines.map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
              ) : (
                <>
                  <Changes title="Before" values={entry.before} />
                  <Changes title="After" values={entry.after} />
                </>
              )}
            </div>
          )}
        </>
      )}
    </>
  )
}
