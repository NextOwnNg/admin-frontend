import type { InputHTMLAttributes, ReactNode } from 'react'
import { Field } from '@/components/ui/Field'
import { cx } from '@/lib/cx'

type TextFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'id'> & {
  label: string
  visibleLabel?: string
  hint?: ReactNode
  error?: string | null
  hideLabel?: boolean
  /** Short fixed text inside the field, e.g. "₦" or "+234". */
  prefix?: string
}

export function TextField({
  label,
  visibleLabel,
  hint,
  error,
  hideLabel,
  prefix,
  className,
  ...inputProps
}: TextFieldProps) {
  return (
    <Field label={label} visibleLabel={visibleLabel} hint={hint} error={error} hideLabel={hideLabel}>
      {({ inputId, describedBy, invalid }) => (
        <div className="relative">
          {prefix && (
            <span
              aria-hidden
              className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-body font-medium text-muted"
            >
              {prefix}
            </span>
          )}
          <input
            id={inputId}
            aria-describedby={describedBy}
            aria-invalid={invalid || undefined}
            className={cx('field-input', prefix && (prefix.length > 1 ? 'pl-16' : 'pl-9'), className)}
            {...inputProps}
          />
        </div>
      )}
    </Field>
  )
}
