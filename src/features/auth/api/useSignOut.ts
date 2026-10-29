import type { QueryClient } from '@tanstack/react-query'
import { signOut } from '@/features/auth/api/auth-api'
import { setCsrfToken } from '@/lib/api/client'
import { resetAllStores } from '@/stores/session'

/** Forget the staff member in this tab: every cached record, the session view and the CSRF token (PRD §3.4). */
export function clearStaffData(queryClient: QueryClient) {
  queryClient.clear()
  resetAllStores()
  setCsrfToken(null)
}

/**
 * Idle timeout and an expired session (PRD §3.5): clear first, so nothing stays on screen while the server
 * call runs; the call is best effort because the session is ending either way.
 */
export function endSession(queryClient: QueryClient, { callServer = true } = {}) {
  clearStaffData(queryClient)
  if (callServer) void signOut().catch(() => {})
}

/**
 * "Sign out": the server must forget the session first. If it can't be reached the cookie is still valid,
 * so this throws and the operator stays signed in and is told (a shared machine must not look signed out).
 */
export async function signOutAndClear(queryClient: QueryClient) {
  await signOut()
  clearStaffData(queryClient)
}
