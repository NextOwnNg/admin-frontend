import type { LucideIcon } from 'lucide-react'
import { cx } from '@/lib/cx'

export type StatusTone = 'neutral' | 'info' | 'success' | 'warning' | 'danger'

const tones: Record<StatusTone, string> = {
  neutral: 'bg-cloud text-muted ring-1 ring-border',
  info: 'bg-info/10 text-info',
  success: 'bg-success/10 text-success',
  warning: 'bg-warning/10 text-warning',
  danger: 'bg-danger/10 text-danger',
}

/** Status is always icon + text; colour only reinforces it (PRD §4.4). */
export function StatusBadge({
  tone,
  icon: Icon,
  label,
  className,
}: {
  tone: StatusTone
  icon: LucideIcon
  label: string
  className?: string
}) {
  return (
    <span
      className={cx(
        'inline-flex h-6 max-w-full items-center gap-1 rounded-full px-2 text-caption font-semibold whitespace-nowrap',
        tones[tone],
        className,
      )}
    >
      <Icon aria-hidden className="size-3.5 shrink-0" strokeWidth={2.25} />
      <span className="truncate">{label}</span>
    </span>
  )
}
