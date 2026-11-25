import { describe, expect, it } from 'vitest'
import { auditSentence } from '@/lib/copy/audit'

describe('listing review in the moderation log (design 2026-11-24 §5.2)', () => {
  it('words the three review actions', () => {
    const target = { type: 'listing' as const, id: 'L-5205', label: 'Xbox Series S' }
    expect(auditSentence({ actor: 'Tunde Bakare', action: 'reject_listing', target })).toBe(
      'Tunde Bakare rejected Xbox Series S',
    )
    expect(auditSentence({ actor: 'Tunde Bakare', action: 'approve_listing', target })).toBe(
      'Tunde Bakare approved Xbox Series S',
    )
    expect(auditSentence({ actor: 'Ngozi Adeyemi', action: 'overturn_review', target })).toBe(
      'Ngozi Adeyemi overturned the review of Xbox Series S',
    )
  })
})
