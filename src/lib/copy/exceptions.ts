import type { ExceptionQueue } from '@/lib/api/types/exceptions'

/** Exception queues in tab order (Phase C design §4.4) */
export const EXCEPTION_QUEUE: Record<ExceptionQueue, string> = {
  partial_confirmation: 'Partial confirmations',
  reservation_expiry: 'Reservation expiries',
  duplicate: 'Duplicate items',
  dispute: 'Open disputes',
  appeal: 'Account appeals',
}
export const EXCEPTION_QUEUES = Object.keys(EXCEPTION_QUEUE) as [ExceptionQueue, ...ExceptionQueue[]]
