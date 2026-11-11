import { useId, type ReactNode, type Ref } from 'react'

/** A titled card on a detail page; the title is the section's h2. */
export function Section({
  title,
  children,
  action,
  headingRef,
}: {
  title: string
  children: ReactNode
  action?: ReactNode
  /** For moving focus to the heading (it becomes focusable by script, not by Tab) */
  headingRef?: Ref<HTMLHeadingElement>
}) {
  const id = useId()
  return (
    <section aria-labelledby={id} className="flex flex-col gap-3 rounded-card border border-border bg-paper p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id={id} ref={headingRef} tabIndex={headingRef ? -1 : undefined} className="text-h3 text-ink">
          {title}
        </h2>
        {action}
      </div>
      {children}
    </section>
  )
}
