import { useId, type ReactNode } from 'react'

/** A titled card on a detail page; the title is the section's h2. */
export function Section({ title, children, action }: { title: string; children: ReactNode; action?: ReactNode }) {
  const id = useId()
  return (
    <section aria-labelledby={id} className="flex flex-col gap-3 rounded-card border border-border bg-paper p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id={id} className="text-h3 text-ink">
          {title}
        </h2>
        {action}
      </div>
      {children}
    </section>
  )
}
