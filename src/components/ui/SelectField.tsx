import { ChevronDown } from 'lucide-react'
import type { ReactNode, SelectHTMLAttributes } from 'react'
import { Field } from '@/components/ui/Field'
import { cx } from '@/lib/cx'

type SelectFieldProps = Omit<SelectHTMLAttributes<HTMLSelectElement>, 'id'> & {
  label: string
  options: { value: string; label: string }[]
  placeholder?: string
  hint?: ReactNode
  error?: string | null
}

/** A native select: keyboard-friendly and fast for short option lists. */
export function SelectField({
  label,
  options,
  placeholder = 'Choose',
  hint,
  error,
  className,
  ...props
}: SelectFieldProps) {
  return (
    <Field label={label} hint={hint} error={error}>
      {({ inputId, describedBy, invalid }) => (
        <div className="relative">
          <select
            id={inputId}
            aria-describedby={describedBy}
            aria-invalid={invalid || undefined}
            className={cx('field-input cursor-pointer appearance-none pr-11', className)}
            {...props}
          >
            <option value="">{placeholder}</option>
            {options.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <ChevronDown
            aria-hidden
            className="pointer-events-none absolute top-1/2 right-4 size-5 -translate-y-1/2 text-muted"
          />
        </div>
      )}
    </Field>
  )
}
