import { describe, expect, it } from 'vitest'
import { formatPhoneDisplay, normalisePhone } from '@/lib/phone/phone'

describe('normalisePhone', () => {
  it.each(['0803 123 4567', '803-123-4567', '+234 803 123 4567', '2348031234567', '08031234567'])(
    'normalises %s to E.164',
    (input) => {
      expect(normalisePhone(input)).toEqual({ ok: true, e164: '+2348031234567' })
    },
  )

  it('rejects numbers that are not Nigerian mobiles', () => {
    expect(normalisePhone('012345678')).toEqual({ ok: false })
    expect(normalisePhone('01 234 5678')).toEqual({ ok: false })
    expect(normalisePhone('')).toEqual({ ok: false })
  })
})

describe('formatPhoneDisplay', () => {
  it('groups an E.164 number for reading', () => {
    expect(formatPhoneDisplay('+2348031234567')).toBe('+234 803 123 4567')
  })
})
