import { Logo, LogoMark } from '@/components/brand/Logo'

/**
 * The console's own lockup for the Ink sidebar: reverse logo plus an "Admin" label, so staff can tell this
 * tab from the marketplace (AD-D-04, builder's proposal). Collapsed, only the mark shows; the name stays.
 */
export function AdminLogo({ collapsed = false }: { collapsed?: boolean }) {
  if (collapsed) return <LogoMark variant="reverse" size={32} label="NextOwn Admin" />

  return (
    <span role="img" aria-label="NextOwn Admin" className="inline-flex items-center gap-2">
      <Logo variant="reverse" height={24} label="" className="shrink-0" />
      <span aria-hidden className="rounded-small bg-mint/15 px-2 text-caption text-mint">
        Admin
      </span>
    </span>
  )
}
