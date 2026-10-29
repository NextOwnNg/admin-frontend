import { Navigate, Outlet, useLocation } from 'react-router'
import { SessionPending } from '@/app/guards/SessionPending'
import { ErrorState } from '@/components/ui/States'
import { useSession } from '@/features/auth/api/useSession'
import { signInPath } from '@/lib/auth/next'
import { useSessionStore } from '@/stores/session'

/**
 * Every console page sits behind this (PRD §2, ADM-FE-01). Anyone who isn't signed-in staff goes to sign in
 * with `next`; the console's contents are never described to them. Hiding is never security: the API refuses
 * the requests either way.
 */
export function RequireStaff() {
  const session = useSession()
  const status = useSessionStore((s) => s.status)
  const { pathname, search, hash } = useLocation()

  if (status === 'staff') return <Outlet />
  if (session.isError) return <ErrorState onRetry={() => void session.refetch()} />
  if (status === 'signed-out') return <Navigate to={signInPath(pathname + search + hash)} replace />
  return <SessionPending />
}
