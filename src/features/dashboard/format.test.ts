import { describe, expect, it } from 'vitest'
import { formatHours, noneInRange, per100, percentOf } from '@/features/dashboard/format'
import { findBannedPhrases } from '@/lib/copy/banned'
import { DASHBOARD_COPY } from '@/lib/copy/dashboard'

describe('dashboard figures (Phase D design §4.2)', () => {
  it('gives every percentage its count, and none without a denominator', () => {
    expect(percentOf(19, 50)).toBe('38% (19 of 50)')
    expect(percentOf(0, 7)).toBe('0% (0 of 7)')
    expect(percentOf(0, 0)).toBeNull()
  })

  it('names the base of a per-100 figure', () => {
    expect(per100(3, 73, 'accepted')).toBe('4.1 per 100 accepted (3 of 73)')
    expect(per100(1, 0, 'accepted')).toBeNull()
  })

  it('reads hours, then days from 48 hours', () => {
    expect(formatHours(35.6)).toBe('36 h')
    expect(formatHours(77)).toBe('3.2 days')
    expect(formatHours(null)).toBeNull()
  })

  it('says when there is nothing to count', () => {
    expect(noneInRange('accepted transactions')).toBe('No accepted transactions in this range')
  })

  it('defines every section without targets or banned claims', () => {
    for (const { title, definition } of Object.values(DASHBOARD_COPY)) {
      const text = `${title} ${definition}`
      expect(findBannedPhrases(text)).toEqual([])
      expect(text).not.toMatch(/target|goal/i)
      expect(definition.length).toBeGreaterThan(20)
    }
  })
})
