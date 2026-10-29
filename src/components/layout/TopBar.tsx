import { Button } from '@heroui/react'
import { useQueryClient } from '@tanstack/react-query'
import { LogOut, Search } from 'lucide-react'
import { Breadcrumbs } from '@/components/layout/Breadcrumbs'
import { EnvRibbon } from '@/components/layout/EnvRibbon'
import { signOutAndClear } from '@/features/auth/api/useSignOut'
import { ROLE_LABELS } from '@/lib/copy/labels'
import { useSessionStore } from '@/stores/session'

/** 64px top bar (PRD §4.3): where you are, record search, environment, who is signed in. */
export function TopBar() {
  const queryClient = useQueryClient()
  const displayName = useSessionStore((s) => s.displayName)
  const roles = useSessionStore((s) => s.roles)

  return (
    <header className="sticky top-0 z-20 flex h-topbar shrink-0 items-center gap-4 border-b border-border bg-paper px-6">
      <div className="min-w-0 flex-1">
        <Breadcrumbs />
      </div>

      <div className="relative hidden w-72 desktop:block" title="Search arrives in Phase C">
        <Search
          aria-hidden
          className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted"
        />
        <input
          type="search"
          disabled
          aria-label="Search records by ID or name"
          placeholder="Search by ID or name"
          className="field-input h-control-compact pl-9 text-compact"
        />
      </div>

      <EnvRibbon />

      <div className="flex items-center gap-3">
        <div className="hidden flex-col items-end leading-tight tablet:flex">
          <span className="text-compact font-semibold text-ink">{displayName}</span>
          <span className="text-caption text-muted">{roles.map((role) => ROLE_LABELS[role]).join(', ')}</span>
        </div>
        <Button variant="tertiary" size="sm" onPress={() => void signOutAndClear(queryClient)}>
          <LogOut aria-hidden className="size-4" />
          Sign out
        </Button>
      </div>
    </header>
  )
}
