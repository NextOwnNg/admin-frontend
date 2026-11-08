import { daysBetween } from '@/lib/time/time'

/** The longest range the dashboard reads at once (Phase D design §4.4) */
export const MAX_RANGE_DAYS = 366

export const RANGE_MESSAGES = {
  order: 'The start date must be on or before the end date.',
  tooLong: `Choose a range of ${MAX_RANGE_DAYS} days or fewer.`,
} as const

/** The mock pilot's start, used until the API's own `pilotStart` has arrived */
export const PILOT_START_HINT = '2026-10-01'

/**
 * What's wrong with a date range, on the field to fix; the form and the mock API share it. With `pilotStart`, the
 * length counts from the pilot start, since nothing before it is read.
 */
export function rangeError(
  from: string | undefined,
  to: string,
  pilotStart?: string,
): { field: 'from' | 'to'; message: string } | null {
  if (from === undefined) return null
  if (from > to) return { field: 'from', message: RANGE_MESSAGES.order }
  const start = pilotStart && pilotStart > from ? pilotStart : from
  if (daysBetween(start, to) > MAX_RANGE_DAYS) return { field: 'to', message: RANGE_MESSAGES.tooLong }
  return null
}
