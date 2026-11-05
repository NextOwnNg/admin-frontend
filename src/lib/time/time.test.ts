import { describe, expect, it } from 'vitest'
import { dueText, formatUTC, formatWAT, timeAgo, withRelative } from '@/lib/time/time'

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
