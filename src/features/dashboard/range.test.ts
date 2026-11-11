import { describe, expect, it } from 'vitest'
import { RANGE_MESSAGES, rangeError } from '@/features/dashboard/range'

describe('rangeError (Phase D design §4.4)', () => {
  it('refuses a start after the end, on the start date', () => {
    expect(rangeError('2026-11-02', '2026-11-01')).toEqual({ field: 'from', message: RANGE_MESSAGES.order })
  })

  it('refuses more than 366 days, on the end date', () => {
    expect(rangeError('2025-11-01', '2026-11-02')).toEqual({ field: 'to', message: RANGE_MESSAGES.tooLong })
  })

  it('measures a range that starts before the pilot from the pilot start (D1 review)', () => {
    expect(rangeError('2025-01-01', '2026-11-08', '2026-10-01')).toBeNull()
    expect(rangeError('2025-01-01', '2026-11-08')).toEqual({ field: 'to', message: RANGE_MESSAGES.tooLong })
  })

  it('accepts exactly 366 days and an open start', () => {
    expect(rangeError('2025-11-02', '2026-11-02')).toBeNull()
    expect(rangeError(undefined, '2026-11-02')).toBeNull()
  })
})
