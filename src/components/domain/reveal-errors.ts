import { errorMessage, isForbidden, isNotFound } from '@/lib/api/error-message'

export const DENIED = "You can't view this in this case."

/** A refused reveal ends the attempt; anything else is shown in the reason dialog to try again. */
export const isDenied = (error: unknown) => isForbidden(error) || isNotFound(error)

export const revealFailure = (error: unknown) =>
  new Error(errorMessage(error, 'We couldn’t show this.', { field: 'reason' }))
