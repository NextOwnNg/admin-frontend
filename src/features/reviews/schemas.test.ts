import { describe, expect, it } from 'vitest'
import { overturnFormSchema, rejectFormSchema } from '@/features/reviews/schemas'

const errorOn = (result: ReturnType<typeof rejectFormSchema.safeParse>, field: string) =>
  result.success ? undefined : result.error.issues.find((i) => i.path[0] === field)?.message

describe('review form schemas (design 2026-11-24 §5.2)', () => {
  it('requires a reason', () => {
    const result = rejectFormSchema.safeParse({ reasonCode: '', sellerMessage: '', note: '' })
    expect(result.success).toBe(false)
    expect(errorOn(result, 'reasonCode')).toBe('Choose a reason')
    expect(overturnFormSchema.safeParse({ reasonCode: '', sellerMessage: '', note: '' }).success).toBe(false)
  })

  it('needs a message with Something else', () => {
    const result = rejectFormSchema.safeParse({ reasonCode: 'REJECT_OTHER', sellerMessage: '   ', note: '' })
    expect(errorOn(result, 'sellerMessage')).toBe('Write a message for the seller.')
    expect(rejectFormSchema.safeParse({ reasonCode: 'REJECT_PHOTOS', sellerMessage: '', note: '' }).success).toBe(true)
  })

  it('accepts 500 characters and refuses 501', () => {
    const ok = rejectFormSchema.safeParse({ reasonCode: 'REJECT_PHOTOS', sellerMessage: 'a'.repeat(500), note: '' })
    expect(ok.success).toBe(true)
    const long = rejectFormSchema.safeParse({ reasonCode: 'REJECT_PHOTOS', sellerMessage: 'a'.repeat(501), note: '' })
    expect(errorOn(long, 'sellerMessage')).toBe('Keep the message to 500 characters.')
  })

  it('trims the message', () => {
    const result = rejectFormSchema.parse({ reasonCode: 'REJECT_PHOTOS', sellerMessage: '  Add a photo. ', note: '' })
    expect(result.sellerMessage).toBe('Add a photo.')
  })
})
