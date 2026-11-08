import type { ReactNode } from 'react'

/** Headline figures shown in both views: label, then the figure with its count */
export function FigureList({ items }: { items: { label: string; value: ReactNode }[] }) {
  return (
    <dl className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2 lg:grid-cols-3">
      {items.map(({ label, value }) => (
        <div key={label} className="flex flex-col gap-0.5">
          <dt className="text-caption text-muted">{label}</dt>
          <dd className="text-body text-ink tabular-nums">{value}</dd>
        </div>
      ))}
    </dl>
  )
}
