import type { StaffRole } from '@/lib/copy/labels'
import { staffDb } from '@/mocks/db/staff'
import type { Viewer } from '@/mocks/db/cases'
import { error } from '@/mocks/handlers/http'
import { network } from '@/mocks/handlers/network'

/** Every admin request: simulated network, then the signed-in staff member or a 401. */
export async function signedIn(): Promise<{ viewer: Viewer & { displayName: string } } | { failure: Response }> {
  const failure = await network()
  if (failure) return { failure }
  const session = staffDb.current()
  if (!session) return { failure: error(401, 'AUTH_REQUIRED', 'Sign in to continue') }
  return { viewer: { staffId: session.staffId, roles: session.roles, displayName: session.displayName } }
}

export const hasRole = (viewer: Viewer, ...roles: StaffRole[]) => viewer.roles.some((r) => roles.includes(r))

export const forbidden = () => error(403, 'FORBIDDEN', "You don't have permission for this action")
export const notFound = () => error(404, 'NOT_FOUND', 'Not found')

/** Values from a comma list that are in `allowed`; unknown ones are ignored, never an error. */
export function listParam<T extends string>(
  params: URLSearchParams,
  key: string,
  allowed: readonly T[],
): T[] | undefined {
  const values = (params.get(key) ?? '')
    .split(',')
    .map((v) => v.trim())
    .filter((v): v is T => (allowed as readonly string[]).includes(v))
  return values.length > 0 ? values : undefined
}

export function oneOf<T extends string>(params: URLSearchParams, key: string, allowed: readonly T[]): T | undefined {
  const value = params.get(key)
  return value !== null && (allowed as readonly string[]).includes(value) ? (value as T) : undefined
}
