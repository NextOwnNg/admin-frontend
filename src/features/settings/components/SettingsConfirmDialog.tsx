import { Button, Modal } from '@heroui/react'
import { useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Banner } from '@/components/ui/Banner'
import { Field } from '@/components/ui/Field'
import { getSettings, settingsQueryKey, useUpdateSettings } from '@/features/settings/api/useSettings'
import { changeLines, fieldName } from '@/features/settings/changes'
import { SECTION_LABELS } from '@/features/settings/schemas'
import { toApiError } from '@/lib/api/api-error'
import { errorMessage, fieldErrorsOf, isConflict } from '@/lib/api/error-message'
import { newIdempotencyKey } from '@/lib/api/idempotency'
import type { AuditEntry } from '@/lib/api/types/audit'
import type { PilotSettings, SettingsSection } from '@/lib/api/types/settings'

const MIN_REASON = 10

/** Shown with every settings change (ADM-03: updates never rewrite agreements) */
export const AGREEMENTS_NOTICE =
  'Changes apply to new listings, offers and reservations only. Existing agreements, offer versions and reservations keep the terms they were made with.'

export type SaveOutcome =
  | { kind: 'saved'; entry: AuditEntry | null }
  /** `version`: the refreshed version to save against once the operator has seen the latest values */
  | { kind: 'conflict'; version: number }
  | { kind: 'fields'; errors: Record<string, string> }

/**
 * Confirms one section's change: each change in words, the reason and the agreements notice. One
 * Idempotency-Key per opening; a lost answer is read back before anything is offered again.
 */
export function SettingsConfirmDialog<S extends SettingsSection>({
  section,
  before,
  after,
  version,
  onClose,
  onOutcome,
}: {
  section: S
  before: PilotSettings[S]
  after: PilotSettings[S]
  version: number
  onClose: () => void
  onOutcome: (outcome: SaveOutcome) => void
}) {
  const queryClient = useQueryClient()
  const update = useUpdateSettings()
  const [key] = useState(newIdempotencyKey)
  const [reason, setReason] = useState('')
  const [phase, setPhase] = useState<'idle' | 'saving' | 'checking' | 'not-saved' | 'unchecked'>('idle')
  // The server's field errors, in words, so one on a field that isn't on screen still shows
  const [fieldList, setFieldList] = useState<string[]>([])
  const [problem, setProblem] = useState<string | null>(null)
  const [reasonError, setReasonError] = useState<string | null>(null)
  const label = SECTION_LABELS[section]
  const lines = changeLines(section, before, after)
  const busy = phase === 'saving' || phase === 'checking'

  async function save() {
    setPhase('saving')
    setProblem(null)
    setFieldList([])
    try {
      const result = await update.mutateAsync({
        section,
        value: after,
        reason: reason.trim(),
        expectedVersion: version,
        idempotencyKey: key,
      })
      onOutcome({ kind: 'saved', entry: result.auditEntry })
    } catch (error) {
      if (isConflict(error)) {
        const fresh = await queryClient
          .fetchQuery({ queryKey: settingsQueryKey, queryFn: () => getSettings(), staleTime: 0 })
          .catch(() => null)
        return onOutcome({ kind: 'conflict', version: fresh?.version ?? version })
      }
      if (toApiError(error).isOutcomeUnknown) {
        setPhase('checking')
        const fresh = await queryClient
          .fetchQuery({ queryKey: settingsQueryKey, queryFn: () => getSettings(), staleTime: 0 })
          .catch(() => null)
        // The check itself failed: say we don't know, not that nothing changed
        if (!fresh) return setPhase('unchecked')
        if (JSON.stringify(fresh[section]) === JSON.stringify(after)) {
          return onOutcome({ kind: 'saved', entry: null })
        }
        return setPhase('not-saved')
      }
      const fields = fieldErrorsOf(error)
      if (fields?.reason) {
        setReasonError(fields.reason)
        return setPhase('idle')
      }
      if (fields) {
        // The dialog stays open with the reason; the fields on screen also show their own message
        setFieldList(Object.entries(fields).map(([path, message]) => `${fieldName(section, path, after)}: ${message}`))
        onOutcome({ kind: 'fields', errors: fields })
        return setPhase('idle')
      }
      setProblem(errorMessage(error, "Your change wasn't saved."))
      setPhase('idle')
    }
  }

  return (
    <Modal isOpen onOpenChange={(open) => !open && !busy && onClose()}>
      <Modal.Backdrop isDismissable={!busy}>
        <Modal.Container size="md" className="max-w-160">
          <Modal.Dialog className="rounded-card">
            <Modal.Header>
              <Modal.Heading className="text-h3 text-ink">Save {label}?</Modal.Heading>
            </Modal.Header>
            <Modal.Body className="flex flex-col gap-4">
              <ul aria-label="Changes" className="flex flex-col gap-1 text-body text-ink">
                {lines.length === 0 ? <li>No changes</li> : lines.map((line) => <li key={line}>{line}</li>)}
              </ul>
              <p className="rounded-small bg-cloud p-3 text-compact text-ink">{AGREEMENTS_NOTICE}</p>
              <Field
                label="Why are you changing this?"
                hint="At least 10 characters. It appears in the history and the moderation log."
                error={reasonError}
              >
                {({ inputId, describedBy, invalid }) => (
                  <textarea
                    id={inputId}
                    rows={3}
                    maxLength={500}
                    aria-describedby={describedBy}
                    aria-invalid={invalid || undefined}
                    className="field-input min-h-20 py-3"
                    value={reason}
                    disabled={busy}
                    onChange={(e) => {
                      setReason(e.target.value)
                      setReasonError(null)
                    }}
                  />
                )}
              </Field>
              {phase === 'checking' && <Banner tone="info" title="Checking the latest status…" />}
              {phase === 'not-saved' && (
                <Banner tone="error" title="Your change wasn't saved.">
                  Nothing changed on the server. Try again: it can't be saved twice.
                </Banner>
              )}
              {phase === 'unchecked' && (
                <Banner tone="error" title="We couldn't check whether your change was saved.">
                  Try again: it can't be saved twice.
                </Banner>
              )}
              {fieldList.length > 0 && (
                <Banner tone="error" title="Check these values">
                  <ul className="list-disc pl-5">
                    {fieldList.map((line) => (
                      <li key={line}>{line}</li>
                    ))}
                  </ul>
                </Banner>
              )}
              {problem && <Banner tone="error" title={problem} />}
            </Modal.Body>
            <Modal.Footer className="flex justify-end gap-2">
              <Button variant="tertiary" slot="close" isDisabled={busy}>
                Cancel
              </Button>
              <Button
                isPending={busy}
                isDisabled={reason.trim().length < MIN_REASON || lines.length === 0}
                onPress={() => void save()}
              >
                {phase === 'not-saved' ? 'Try again' : 'Save change'}
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  )
}
