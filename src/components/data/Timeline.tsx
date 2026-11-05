import type { ReactNode } from 'react'

/** An ordered list of events on a rail; each child is an `<li>`. */
export function Timeline({ label, children }: { label: string; children: ReactNode }) {
  return (
    <ol aria-label={label} className="flex flex-col gap-4 border-l-2 border-border pl-4">
      {children}
    </ol>
  )
}
