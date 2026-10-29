import { toApiError } from '@/lib/api/api-error'

/** Yes/no questions about a failed request, for code that decides what to do next (see `error-message`). */

/** The session ended: sign-in takes over, so screens show nothing of their own. */
export const isSignedOut = (error: unknown) => toApiError(error).status === 401

export const isForbidden = (error: unknown) => toApiError(error).status === 403

/** Pages show the generic not-found for this, with no hint that a private record exists (PRD §3.3). */
export const isNotFound = (error: unknown) => toApiError(error).status === 404

/** The case or record changed since it was opened: show the latest and ask for a review (PRD §3.3). */
export const isConflict = (error: unknown) => toApiError(error).status === 409

/** A read worth trying again: the request didn't arrive or the server failed. Never a 4xx (PRD §3.3). */
export function isRetryable(error: unknown) {
  const { status } = toApiError(error)
  return status === undefined || status >= 500
}
