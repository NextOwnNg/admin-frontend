import { Eye, EyeOff } from 'lucide-react'
import { useState, type InputHTMLAttributes, type ReactNode } from 'react'
import { Field } from '@/components/ui/Field'
import { cx } from '@/lib/cx'

type PasswordFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'id' | 'type'> & {
  label?: string
  hint?: ReactNode
  error?: string | null
  /** `current-password` to sign in, `new-password` to set one (so password managers offer the right thing). */
  autoComplete: 'current-password' | 'new-password'
}

/** A password input with a show/hide toggle, so what was typed can be checked before sending. */
export function PasswordField({ label = 'Password', hint, error, className, ...inputProps }: PasswordFieldProps) {
  const [visible, setVisible] = useState(false)

  return (
    <Field label={label} hint={hint} error={error}>
      {({ inputId, describedBy, invalid }) => (
        <div className="relative">
          <input
            id={inputId}
            type={visible ? 'text' : 'password'}
            aria-describedby={describedBy}
            aria-invalid={invalid || undefined}
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            className={cx('field-input pr-12', className)}
            {...inputProps}
          />
          <button
            type="button"
            aria-label={visible ? 'Hide password' : 'Show password'}
            aria-pressed={visible}
            aria-controls={inputId}
            onClick={() => setVisible((v) => !v)}
            className="absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-r-control text-muted hover:text-ink"
          >
            {visible ? <EyeOff aria-hidden className="size-5" /> : <Eye aria-hidden className="size-5" />}
          </button>
        </div>
      )}
    </Field>
  )
}
