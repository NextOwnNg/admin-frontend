import { CircleAlert, CircleCheck, Info, TriangleAlert, type LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { cx } from '@/lib/cx'

export type BannerTone = 'info' | 'success' | 'warning' | 'error'

const tones: Record<BannerTone, { className: string; icon: LucideIcon; iconClass: string; role: 'status' | 'alert' }> =
  {
    info: { className: 'bg-mint', icon: Info, iconClass: 'text-info', role: 'status' },
    success: { className: 'bg-success/10', icon: CircleCheck, iconClass: 'text-success', role: 'status' },
    warning: { className: 'bg-warning/10', icon: TriangleAlert, iconClass: 'text-warning', role: 'status' },
    error: { className: 'bg-danger/10', icon: CircleAlert, iconClass: 'text-danger', role: 'alert' },
  }

/** Persistent inline message (PRD §4.4). Critical errors use this, never an auto-dismissing toast. */
export function Banner({
  tone,
  title,
  children,
  action,
  className,
}: {
  tone: BannerTone
  title: string
  children?: ReactNode
  action?: ReactNode
  className?: string
}) {
  const { className: toneClass, icon: Icon, iconClass, role } = tones[tone]
  return (
    <div role={role} className={cx('flex gap-3 rounded-control p-4 text-ink', toneClass, className)}>
      <Icon aria-hidden className={cx('mt-0.5 size-5 shrink-0', iconClass)} />
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <p className="text-body font-semibold">{title}</p>
        {children && <div className="text-compact text-muted">{children}</div>}
        {action && <div className="mt-2">{action}</div>}
      </div>
    </div>
  )
}
