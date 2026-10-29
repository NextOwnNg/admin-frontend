import { create } from 'zustand'
import type { StaffSession } from '@/lib/api/types/auth'
import { STAFF_ROLES, type StaffRole } from '@/lib/copy/labels'

/**
 * Staff session view state only (PRD §3.4): who is signed in and their roles, mirrored from
 * `GET /admin/session`. Never tokens (the session is an HttpOnly cookie) and never API data, which lives in
 * TanStack Query. `unknown` until the first session check answers, so guards wait instead of redirecting.
 */
export type SessionStatus = 'unknown' | 'signed-out' | 'staff'

const DEFAULT_IDLE_TIMEOUT_SECONDS = 30 * 60

type SessionState = {
  status: SessionStatus
  staffId: string | null
  displayName: string | null
  roles: StaffRole[]
  idleTimeoutSeconds: number
  setSession: (session: StaffSession) => void
  clearSession: () => void
}

const signedOut = {
  status: 'signed-out' as const,
  staffId: null,
  displayName: null,
  roles: [],
  idleTimeoutSeconds: DEFAULT_IDLE_TIMEOUT_SECONDS,
}

export const useSessionStore = create<SessionState>()((set) => ({
  status: 'unknown',
  staffId: null,
  displayName: null,
  roles: [],
  idleTimeoutSeconds: DEFAULT_IDLE_TIMEOUT_SECONDS,
  setSession: ({ staffId, displayName, roles, idleTimeoutSeconds }) =>
    set({ status: 'staff', staffId, displayName, roles, idleTimeoutSeconds }),
  clearSession: () => set(signedOut),
}))

/**
 * Mirrors the session into the store. Unknown role names are dropped; a session with no known role is not
 * staff (PRD §2: non-staff never see the console).
 */
export function applySession(session: StaffSession | null) {
  const { setSession, clearSession } = useSessionStore.getState()
  const roles = (session?.roles ?? []).filter((role): role is StaffRole => STAFF_ROLES.includes(role))
  if (session && roles.length > 0) setSession({ ...session, roles })
  else clearSession()
}

/** Sign-out and idle timeout: forget the staff member. Preferences (sidebar, table columns) stay. */
export function resetAllStores() {
  useSessionStore.getState().clearSession()
}
