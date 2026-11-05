import { useState } from 'react'
import { AuditEntry } from '@/components/domain/AuditEntry'
import { PageHead } from '@/components/seo/PageHead'
import { Banner } from '@/components/ui/Banner'
import { ErrorState, PermissionDenied, TableSkeleton } from '@/components/ui/States'
import { useSettings } from '@/features/settings/api/useSettings'
import { SettingsHistory } from '@/features/settings/components/SettingsHistory'
import { SettingsSection } from '@/features/settings/components/SettingsSection'
import { SETTINGS_SECTIONS } from '@/features/settings/schemas'
import { isForbidden } from '@/lib/api/error-message'
import type { AuditEntry as AuditEntryData } from '@/lib/api/types/audit'
import type { SettingsSection as Section } from '@/lib/api/types/settings'
import { formatWAT } from '@/lib/time/time'

/** Pilot settings (ADM-FE-09): versioned, validated, one section at a time, never rewriting agreements. */
export function SettingsPage() {
  const settings = useSettings()
  const [editing, setEditing] = useState<Section | null>(null)
  const [saved, setSaved] = useState<{ entry: AuditEntryData | null } | null>(null)

  if (isForbidden(settings.error)) return <PermissionDenied />
  const data = settings.data

  return (
    <>
      <PageHead title="Settings" />
      <div className="flex max-w-240 flex-col gap-6">
        <header className="flex flex-col gap-1">
          <h1 className="text-h1 text-ink">Settings</h1>
          {data && (
            <p className="text-compact text-muted tabular-nums">
              Version {data.version} · last changed by {data.updatedBy}, {formatWAT(data.updatedAt)}
            </p>
          )}
        </header>
        {saved && (
          <Banner tone="success" title="Saved">
            {saved.entry ? <AuditEntry entry={saved.entry} /> : 'Your change was saved.'}
          </Banner>
        )}
        {settings.isError && !data ? (
          <ErrorState onRetry={() => void settings.refetch()} />
        ) : !data ? (
          <TableSkeleton rows={6} columns={1} />
        ) : (
          <>
            {SETTINGS_SECTIONS.map((section) => (
              <SettingsSection
                key={section}
                section={section}
                settings={data}
                editing={editing === section}
                locked={editing !== null && editing !== section}
                onEdit={() => {
                  setSaved(null)
                  setEditing(section)
                }}
                onDone={(result) => {
                  setEditing(null)
                  if (result) setSaved(result)
                }}
              />
            ))}
            <SettingsHistory />
          </>
        )}
      </div>
    </>
  )
}
