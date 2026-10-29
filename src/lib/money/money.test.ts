import { describe, expect, it } from 'vitest'
import { cashDirection, formatNaira } from '@/lib/money/money'

describe('formatNaira', () => {
  it('formats integer kobo as whole naira with grouping', () => {
    expect(formatNaira(35_000_000)).toBe('₦350,000')
    expect(formatNaira(0)).toBe('₦0')
  })
})

describe('cashDirection (PRD §4.6)', () => {
  it('says who pays whom as a sentence', () => {
    expect(cashDirection('OffererPays', 5_000_000)).toBe('Offerer pays owner ₦50,000')
    expect(cashDirection('OwnerPays', 5_000_000)).toBe('Owner pays offerer ₦50,000')
    expect(cashDirection('None', 0)).toBe('No cash')
  })
})
