import { Navigate, Outlet, useSearchParams } from 'react-router'
import { useSession } from '@/features/auth/api/useSession'
import { safeNext } from '@/lib/auth/next'
import { useSessionStore } from '@/stores/session'

/** The sign-in page: staff who are already signed in carry straight on to where they were going. */
export function RedirectIfStaff() {
  useSession()
  const status = useSessionStore((s) => s.status)
  const [params] = useSearchParams()

  if (status === 'staff') return <Navigate to={safeNext(params.get('next'))} replace />
  return <Outlet />
}
