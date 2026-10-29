import { Monitor } from 'lucide-react'
import { AdminLogo } from '@/components/brand/AdminLogo'

/** Phone widths aren't supported (PRD §4.3): this covers the console below 768px. */
export function SmallScreenNotice() {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-ink px-4 text-center text-paper">
      <AdminLogo />
      <Monitor aria-hidden className="mt-4 size-8 text-mint" />
      <h1 className="text-h3">Use a larger screen</h1>
      <p className="max-w-xs text-body text-mint">The admin console needs a screen at least 768 px wide.</p>
    </div>
  )
}
