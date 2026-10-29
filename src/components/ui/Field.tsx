import { CircleAlert } from 'lucide-react'
import { useId, type ReactNode } from 'react'

type FieldIds = { inputId: string; describedBy: string | undefined; invalid: boolean }

type FieldProps = {
  label: string
  /** Shorter on-screen label when a group heading gives the context (e.g. "Minimum" under "Price"); `label` stays the accessible name. */
  visibleLabel?: string
  hint?: ReactNode
  error?: string | null
  /** Visually hide the label when the surrounding UI already names the field. */
  hideLabel?: boolean
  children: (ids: FieldIds) => ReactNode
}

/** Label above, hint below, error replacing nothing: both stay programmatically linked to the input. */
export function Field({ label, visibleLabel, hint, error, hideLabel, children }: FieldProps) {
  const inputId = useId()
  const hintId = `${inputId}-hint`
  const errorId = `${inputId}-error`
  const describedBy = [error ? errorId : null, hint ? hintId : null].filter(Boolean).join(' ') || undefined

  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={inputId} className={hideLabel ? 'sr-only' : 'text-compact font-medium text-ink'}>
        {visibleLabel ? (
          <>
            <span aria-hidden>{visibleLabel}</span>
            <span className="sr-only">{label}</span>
          </>
        ) : (
          label
        )}
      </label>
      {children({ inputId, describedBy, invalid: Boolean(error) })}
      {error && (
        <p id={errorId} className="flex items-start gap-1.5 text-compact text-danger">
          <CircleAlert aria-hidden className="mt-0.5 size-4 shrink-0" />
          {error}
        </p>
      )}
      {hint && (
        <p id={hintId} className="text-compact text-muted">
          {hint}
        </p>
      )}
    </div>
  )
}
