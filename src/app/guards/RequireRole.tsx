import { Outlet } from 'react-router'
import { PermissionDenied } from '@/components/ui/States'
import { canAccess, type RouteId } from '@/lib/permissions/permissions'
import { useSessionStore } from '@/stores/session'

/** A screen this role can't use shows the permission state and nothing of the page (QA-16). */
export function RequireRole({ routeId }: { routeId: RouteId }) {
  const roles = useSessionStore((s) => s.roles)
  return canAccess(routeId, roles) ? <Outlet /> : <PermissionDenied />
}
