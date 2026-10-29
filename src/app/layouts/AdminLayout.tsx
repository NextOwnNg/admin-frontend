import { useQueryClient } from '@tanstack/react-query'
import { Outlet } from 'react-router'
import { IdleTimeoutModal } from '@/components/layout/IdleTimeoutModal'
import { Sidebar } from '@/components/layout/Sidebar'
import { SkipLink } from '@/components/layout/SkipLink'
import { TopBar } from '@/components/layout/TopBar'
import { endSession } from '@/features/auth/api/useSignOut'
import { useIdleTimer } from '@/hooks/useIdleTimer'
import { useSessionStore } from '@/stores/session'

/**
 * The signed-in console (PRD §4.3): Ink sidebar, top bar, page content up to 1600px. Idle sign-out clears
 * every cached record; `RequireStaff` then sends the operator to sign in and back to the same URL.
 */
export function AdminLayout() {
  const queryClient = useQueryClient()
  const idleTimeoutSeconds = useSessionStore((s) => s.idleTimeoutSeconds)
  const idle = useIdleTimer({
    timeoutSeconds: idleTimeoutSeconds,
    onTimeout: () => endSession(queryClient),
  })

  return (
    <div className="flex min-h-dvh bg-background">
      <SkipLink />
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar />
        <main id="main" className="mx-auto w-full max-w-table flex-1 px-6 py-8">
          <Outlet />
        </main>
      </div>
      <IdleTimeoutModal open={idle.warning} secondsLeft={idle.secondsLeft} onStay={idle.stayActive} />
    </div>
  )
}
