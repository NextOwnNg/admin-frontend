import type { ActionTarget } from '@/features/actions/definitions'
import { TARGET_TYPE_LABELS } from '@/lib/copy/labels'

/** Shown when more than one target fits the action (design §9a.3). */
export function TargetPicker({
  targets,
  value,
  onChange,
}: {
  targets: ActionTarget[]
  value: string
  onChange: (id: string) => void
}) {
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-1 text-compact font-medium text-ink">Applies to</legend>
      {targets.map((t) => (
        <label key={t.id} className="flex min-h-touch cursor-pointer items-center gap-3 text-body text-ink">
          <input
            type="radio"
            name="action-target"
            value={t.id}
            checked={value === t.id}
            onChange={() => onChange(t.id)}
            className="size-5 accent-action"
          />
          <span>
            {t.label}
            <span aria-hidden className="ml-2 text-compact text-muted">
              {TARGET_TYPE_LABELS[t.type]}
            </span>
          </span>
        </label>
      ))}
    </fieldset>
  )
}
