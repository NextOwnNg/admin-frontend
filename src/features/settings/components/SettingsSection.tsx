import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useRef, useState } from 'react'
import { useForm, type FieldValues, type Resolver } from 'react-hook-form'
import { z } from 'zod'
import { PlainButton } from '@/components/ui/Button'
import { Banner } from '@/components/ui/Banner'
import { Section } from '@/components/ui/Section'
import { sectionSummary } from '@/features/settings/changes'
import { SettingsConfirmDialog, type SaveOutcome } from '@/features/settings/components/SettingsConfirmDialog'
import { SectionFields } from '@/features/settings/forms/SectionFields'
import { SECTION_LABELS, SECTION_SCHEMAS } from '@/features/settings/schemas'
import type { AuditEntry } from '@/lib/api/types/audit'
import type { PilotSettings, SettingsSection as Section_ } from '@/lib/api/types/settings'

/** One settings card: read-only with Edit, or its form with Save and Cancel (Phase C design §4.5) */
export function SettingsSection({
  section,
  settings,
  editing,
  locked,
  onEdit,
  onDone,
}: {
  section: Section_
  settings: PilotSettings
  editing: boolean
  /** Another section is being edited */
  locked: boolean
  onEdit: () => void
  onDone: (saved: { entry: AuditEntry | null } | null) => void
}) {
  const label = SECTION_LABELS[section]
  // Leaving the form (Save or Cancel) puts focus back on this section's heading, not on the page
  const heading = useRef<HTMLHeadingElement>(null)
  const wasEditing = useRef(editing)
  useEffect(() => {
    if (wasEditing.current && !editing) heading.current?.focus()
    wasEditing.current = editing
  }, [editing])
  return (
    <Section
      title={label}
      headingRef={heading}
      action={
        !editing && (
          <PlainButton
            size="compact"
            variant="secondary"
            aria-label={`Edit ${label}`}
            disabled={locked}
            onClick={onEdit}
          >
            Edit
          </PlainButton>
        )
      }
    >
      {editing ? (
        <EditForm section={section} settings={settings} onDone={onDone} />
      ) : (
        <ul className="flex flex-col gap-1 text-compact text-ink">
          {sectionSummary(section, settings[section]).map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      )}
    </Section>
  )
}

/** Mounted only while editing, so Cancel throws every change away */
function EditForm({
  section,
  settings,
  onDone,
}: {
  section: Section_
  settings: PilotSettings
  onDone: (saved: { entry: AuditEntry | null } | null) => void
}) {
  const form = useForm<FieldValues>({
    // One form shape for every section; the section's schema decides what `value` holds
    resolver: zodResolver(
      z.object({ value: SECTION_SCHEMAS[section] as z.ZodType }),
    ) as unknown as Resolver<FieldValues>,
    defaultValues: { value: structuredClone(settings[section]) },
  })
  const [pending, setPending] = useState<{ value: PilotSettings[Section_]; version: number } | null>(null)
  const [conflict, setConflict] = useState(false)
  // The version this edit started from. A background refetch never moves it, so a change someone else
  // saved meanwhile comes back as a conflict; only acknowledging that conflict moves it on.
  const [baseVersion, setBaseVersion] = useState(settings.version)
  // Whole-list rules (one active city, one active category) have no single field to sit under
  const rootError =
    (form.formState.errors.value as { message?: string; root?: { message?: string } } | undefined)?.message ??
    (form.formState.errors.value as { root?: { message?: string } } | undefined)?.root?.message

  const outcome = (result: SaveOutcome) => {
    // Field errors keep the dialog open, with the reason; they also show under the fields on screen
    if (result.kind === 'fields') {
      for (const [path, message] of Object.entries(result.errors)) form.setError(path, { message })
      return
    }
    setPending(null)
    if (result.kind === 'saved') return onDone({ entry: result.entry })
    setBaseVersion(result.version)
    setConflict(true)
  }

  return (
    <form
      noValidate
      className="flex flex-col gap-4"
      onSubmit={(e) =>
        void form.handleSubmit((values) => {
          setConflict(false)
          setPending({ value: values.value as PilotSettings[Section_], version: baseVersion })
        })(e)
      }
    >
      {conflict && (
        <Banner tone="warning" title="Settings changed since you opened them.">
          Review the latest values before saving again. Your entries are kept.
        </Banner>
      )}
      <SectionFields section={section} form={form} inUse={settings.inUse} />
      {rootError && (section === 'locations' || section === 'categories') && (
        <p role="alert" className="text-compact text-danger">
          {rootError}
        </p>
      )}
      <div className="flex gap-2">
        <PlainButton type="submit" size="compact" variant="primary">
          Save
        </PlainButton>
        <PlainButton size="compact" variant="tertiary" onClick={() => onDone(null)}>
          Cancel
        </PlainButton>
      </div>
      {pending && (
        <SettingsConfirmDialog
          section={section}
          before={settings[section]}
          after={pending.value}
          version={pending.version}
          onClose={() => setPending(null)}
          onOutcome={outcome}
        />
      )}
    </form>
  )
}
