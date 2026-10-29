import { useQuery } from '@tanstack/react-query'
import { getSession, sessionQueryKey } from '@/features/auth/api/auth-api'
import { setCsrfToken } from '@/lib/api/client'
import { applySession } from '@/stores/session'

/**
 * The staff session (PRD §3.5), mirrored into the session store so guards and navigation read one place.
 * A failed check (network, 5xx) stays a query error: the guard offers a retry instead of signing out.
 */
export function useSession() {
  return useQuery({
    queryKey: sessionQueryKey,
    queryFn: async ({ signal }) => {
      const session = await getSession({ signal })
      applySession(session)
      setCsrfToken(session?.csrfToken ?? null)
      return session
    },
  })
}
