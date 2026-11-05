import { Button } from '@heroui/react'
import { useState } from 'react'
import { Field } from '@/components/ui/Field'
import { Section } from '@/components/ui/Section'
import { useAddNote } from '@/features/cases/api/useAddNote'
import { useNow } from '@/hooks/useNow'
import { errorMessage } from '@/lib/api/error-message'
import { newIdempotencyKey } from '@/lib/api/idempotency'
import type { CaseDetail } from '@/lib/api/types/cases'
import { withRelative } from '@/lib/time/time'

/** Internal notes (design §4.3): staff only, plain text. */
export function NotesSection({ caseDetail }: { caseDetail: CaseDetail }) {
  const now = useNow()
  const addNote = useAddNote(caseDetail.id)
  const [body, setBody] = useState('')
  const [key, setKey] = useState(newIdempotencyKey)
  const [saved, setSaved] = useState(false)

  function save() {
    setSaved(false)
    addNote.mutate(
      { body: body.trim(), idempotencyKey: key },
      {
        onSuccess: () => {
          setBody('')
          setKey(newIdempotencyKey())
          setSaved(true)
        },
      },
    )
  }

  return (
    <Section title="Staff notes">
      {caseDetail.notes.length === 0 ? (
        <p className="text-compact text-muted">No notes yet.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {caseDetail.notes.map((note) => (
            <li key={note.id} className="flex flex-col gap-0.5">
              <p className="text-caption text-muted tabular-nums">
                {note.author} · {withRelative(note.at, now)}
              </p>
              <p className="text-body whitespace-pre-wrap text-ink">{note.body}</p>
            </li>
          ))}
        </ul>
      )}
      <form
        className="flex flex-col gap-2 border-t border-border pt-3"
        onSubmit={(e) => {
          e.preventDefault()
          save()
        }}
      >
        <Field
          label="Add a note"
          hint="Only staff see notes."
          error={addNote.isError ? errorMessage(addNote.error, 'The note wasn’t saved.') : null}
        >
          {({ inputId, describedBy, invalid }) => (
            <textarea
              id={inputId}
              aria-describedby={describedBy}
              aria-invalid={invalid || undefined}
              rows={3}
              maxLength={2000}
              className="field-input min-h-20 py-3"
              value={body}
              onChange={(e) => {
                setBody(e.target.value)
                setSaved(false)
              }}
            />
          )}
        </Field>
        <div className="flex items-center gap-3">
          <Button type="submit" size="sm" isDisabled={!body.trim()} isPending={addNote.isPending}>
            Save note
          </Button>
          <span role="status" className="text-compact text-success">
            {saved ? 'Note saved' : ''}
          </span>
        </div>
      </form>
    </Section>
  )
}
