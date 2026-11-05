import { describe, expect, it } from 'vitest'
import {
  CASE_STATUS,
  confirmationCount,
  SEVERITY,
  TRANSACTION_FLAG,
  TRANSACTION_STATUS,
  type TransactionStatus,
} from '@/lib/copy/status'

describe('status copy (design §5)', () => {
  it('labels every severity with an icon and tone', () => {
    expect(Object.keys(SEVERITY)).toEqual(['S1', 'S2', 'S3', 'S4'])
    expect(SEVERITY.S1.label).toBe('S1 Urgent safety')
    expect(SEVERITY.S1.tone).toBe('danger')
    expect(SEVERITY.S4.label).toBe('S4 Help')
  })

  it('labels every case status', () => {
    expect(Object.values(CASE_STATUS).map((s) => s.label)).toEqual([
      'Open',
      'Assigned',
      'Awaiting information',
      'Escalated',
      'Resolved',
      'Closed',
    ])
  })

  it('never labels an administrative outcome as completed', () => {
    const administrative: TransactionStatus[] = ['RESOLVED_BY_SUPPORT_CANCELLED', 'RESOLVED_BY_SUPPORT_NO_COMPLETION']
    for (const status of administrative) {
      expect(TRANSACTION_STATUS[status].label).not.toMatch(/completed/i)
      expect(TRANSACTION_STATUS[status].label).toMatch(/^Resolved by support/)
    }
    expect(TRANSACTION_STATUS.COMPLETED.label).toBe('Completed')
  })

  it('labels exception flags', () => {
    expect(TRANSACTION_FLAG.PARTIAL_CONFIRMATION_TIMEOUT.label).toBe('Partial confirmation expired')
  })

  it('counts confirmations out of two', () => {
    expect(confirmationCount(0)).toBe('0 of 2 confirmed')
    expect(confirmationCount(1)).toBe('1 of 2 confirmed')
    expect(confirmationCount(2)).toBe('2 of 2 confirmed')
  })
})
