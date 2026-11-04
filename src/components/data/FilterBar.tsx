import { X } from 'lucide-react'
import type { ReactNode } from 'react'
import { PlainButton } from '@/components/ui/Button'

export type FilterChip = { key: string; label: string; onRemove: () => void }

/** Filter controls, then the active filters as removable chips (design §4.2). */
export function FilterBar({
  children,
  chips,
  onClear,
}: {
  children: ReactNode
  chips: FilterChip[]
  onClear: () => void
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-end gap-3">{children}</div>
      {chips.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <ul aria-label="Active filters" className="flex flex-wrap gap-2">
            {chips.map((chip) => (
              <li key={chip.key}>
                <span className="inline-flex h-8 items-center gap-1 rounded-full bg-mint pr-1 pl-3 text-compact font-medium text-ink">
                  {chip.label}
                  <button
                    type="button"
                    aria-label={`Remove filter ${chip.label}`}
                    onClick={chip.onRemove}
                    className="flex size-6 items-center justify-center rounded-full text-muted hover:bg-paper hover:text-ink"
                  >
                    <X aria-hidden className="size-4" />
                  </button>
                </span>
              </li>
            ))}
          </ul>
          <PlainButton variant="ghost" size="sm" onClick={onClear}>
            Clear filters
          </PlainButton>
        </div>
      )}
    </div>
  )
}
