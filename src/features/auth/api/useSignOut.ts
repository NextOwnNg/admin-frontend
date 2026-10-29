import type { QueryClient } from '@tanstack/react-query'
import { signOut } from '@/features/auth/api/auth-api'
import { setCsrfToken } from '@/lib/api/client'
import { resetAllStores } from '@/stores/session'

/**
 * Sign-out, idle timeout and an expired session all end here (PRD §3.4, §3.5): every cached record goes,
 * then the stores reset. The server call is best effort; the console forgets either way.
 */
export async function signOutAndClear(queryClient: QueryClient, { callServer = true } = {}) {
  if (callServer) await signOut().catch(() => {})
  queryClient.clear()
  resetAllStores()
  setCsrfToken(null)
}
