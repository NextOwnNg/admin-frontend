import { describe, expect, it } from 'vitest'
import {
  addDays,
  daysBetween,
  dueText,
  formatUTC,
  formatWAT,
  timeAgo,
  watDayEnd,
  watDayStart,
  watToday,
  withRelative,
} from '@/lib/time/time'

const ISO = '2026-10-24T17:05:00Z'
const at = (iso: string) => Date.parse(iso)

describe('formatWAT (PRD §4.6)', () => {
  it('shows date and 24-hour time in West Africa Time', () => {
    expect(formatWAT(ISO)).toBe('24 Oct 2026, 18:05 WAT')
  })

  it('crosses midnight into the WAT date', () => {
    expect(formatWAT('2026-10-24T23:30:00Z')).toBe('25 Oct 2026, 00:30 WAT')
  })
})

describe('formatUTC', () => {
  it('shows the exact UTC timestamp for audit ordering', () => {
    expect(formatUTC(ISO)).toBe('2026-10-24 17:05:00 UTC')
  })
})

describe('timeAgo', () => {
  it('reads elapsed time in words', () => {
    expect(timeAgo(ISO, at('2026-10-24T17:05:30Z'))).toBe('Just now')
    expect(timeAgo(ISO, at('2026-10-24T17:10:00Z'))).toBe('5 min ago')
    expect(timeAgo(ISO, at('2026-10-24T20:05:00Z'))).toBe('3 h ago')
    expect(timeAgo(ISO, at('2026-10-25T20:05:00Z'))).toBe('Yesterday')
    expect(timeAgo(ISO, at('2026-10-28T20:05:00Z'))).toBe('24 Oct 2026')
  })
})

describe('withRelative', () => {
  it('always pairs the relative time with the absolute time', () => {
    expect(withRelative(ISO, at('2026-10-24T20:05:00Z'))).toBe('3 h ago · 24 Oct 2026, 18:05 WAT')
  })
})

describe('dueText', () => {
  const now = Date.parse('2026-10-24T12:00:00Z')
  it('counts down to the due time, then says overdue', () => {
    expect(dueText('2026-10-24T12:42:30Z', now)).toBe('Due in 42 min')
    expect(dueText('2026-10-24T15:30:00Z', now)).toBe('Due in 3 h')
    expect(dueText('2026-10-27T12:00:00Z', now)).toBe('Due in 3 days')
    expect(dueText('2026-10-24T11:59:00Z', now)).toBe('Overdue')
  })
})

describe('WAT calendar days', () => {
  it('starts a WAT day at 23:00 UTC the day before', () => {
    expect(watDayStart('2026-11-05')).toBe('2026-11-04T23:00:00.000Z')
  })
  it('ends a WAT day at 22:59:59.999 UTC', () => {
    expect(watDayEnd('2026-11-05')).toBe('2026-11-05T22:59:59.999Z')
  })
  it('crosses month and year ends', () => {
    expect(watDayStart('2027-01-01')).toBe('2026-12-31T23:00:00.000Z')
    expect(watDayEnd('2026-12-31')).toBe('2026-12-31T22:59:59.999Z')
  })
})

describe('WAT calendar days (Phase D dashboard)', () => {
  it('reads today in WAT, which turns over at 23:00 UTC', () => {
    expect(watToday(at('2026-11-07T23:30:00Z'))).toBe('2026-11-08')
    expect(watToday(at('2026-11-07T22:30:00Z'))).toBe('2026-11-07')
  })

  it('moves by whole days and counts days inclusively', () => {
    expect(addDays('2026-11-01', -29)).toBe('2026-10-03')
    expect(addDays('2026-10-31', 1)).toBe('2026-11-01')
    expect(daysBetween('2026-11-01', '2026-11-01')).toBe(1)
    expect(daysBetween('2025-11-02', '2026-11-02')).toBe(366)
  })
})
