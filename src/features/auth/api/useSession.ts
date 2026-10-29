import { useQuery, useQueryClient } from '@tanstack/react-query'
import { getSession, sessionQueryKey } from '@/features/auth/api/auth-api'
import { endSession } from '@/features/auth/api/useSignOut'
import { setCsrfToken } from '@/lib/api/client'
import { applySession, useSessionStore } from '@/stores/session'

/**
 * The staff session (PRD §3.5), mirrored into the session store so guards and navigation read one place.
 * A failed check (network, 5xx) stays a query error: the guard offers a retry instead of signing out.
 */
export function useSession() {
  const queryClient = useQueryClient()
  return useQuery({
    queryKey: sessionQueryKey,
    queryFn: async ({ signal }) => {
      const session = await getSession({ signal })
      // The session ended on the server while this tab still held staff data: a 401 clears everything (PRD §3.3)
      if (!session && useSessionStore.getState().status === 'staff') endSession(queryClient, { callServer: false })
      applySession(session)
      setCsrfToken(session?.csrfToken ?? null)
      return session
    },
  })
}
