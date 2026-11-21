import type { TextareaHTMLAttributes } from 'react'
import { Field } from '@/components/ui/Field'

/** The free-text reason every staff change needs; it appears in the moderation log. */
export function ReasonField({
  label,
  error,
  ...props
}: Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'id'> & { label: string; error?: string }) {
  return (
    <Field label={label} hint="It appears in the moderation log." error={error}>
      {({ inputId, describedBy, invalid }) => (
        <textarea
          id={inputId}
          rows={3}
          maxLength={500}
          aria-describedby={describedBy}
          aria-invalid={invalid || undefined}
          className="field-input min-h-20 py-3"
          {...props}
        />
      )}
    </Field>
  )
}
