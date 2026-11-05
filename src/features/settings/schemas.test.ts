import { describe, expect, it } from 'vitest'
import { z } from 'zod'
import { SECTION_SCHEMAS } from '@/features/settings/schemas'

const check = <S extends keyof typeof SECTION_SCHEMAS>(section: S, value: unknown) =>
  z.safeParse(SECTION_SCHEMAS[section], value)
const messages = (result: ReturnType<typeof check>) => (result.success ? [] : result.error.issues.map((i) => i.message))
const area = (name: string, active = true) => ({ id: `a-${name}`, name, active })
const lagos = (areas = [area('Yaba')], active = true) => [{ id: 'c-lagos', name: 'Lagos', active, areas }]

describe('settings rules (Phase C design §4.5)', () => {
  it('keeps the offer lifetime to whole hours from 24 to 168', () => {
    for (const bad of [23, 169, 72.5]) {
      expect(messages(check('offerLifetimeHours', bad))).toEqual(['Enter a whole number of hours from 24 to 168.'])
    }
    expect(check('offerLifetimeHours', 24).success).toBe(true)
    expect(check('offerLifetimeHours', 168).success).toBe(true)
  })

  it('keeps reservations to whole days from 1 to 14', () => {
    expect(messages(check('reservationDays', 15))).toEqual(['Enter a whole number of days from 1 to 14.'])
    expect(check('reservationDays', 7).success).toBe(true)
  })

  it('needs at least as many photos allowed as required, up to 12', () => {
    expect(check('photoLimits', { min: 9, max: 8 }).success).toBe(false)
    expect(check('photoLimits', { min: 1, max: 13 }).success).toBe(false)
    expect(check('photoLimits', { min: 3, max: 8 }).success).toBe(true)
  })

  it('treats names that differ only in case or spaces as duplicates', () => {
    expect(messages(check('locations', lagos([area('Yaba'), area(' yaba ')])))).toContain(
      'yaba is already in the list.',
    )
  })

  it('keeps one active city with an active area', () => {
    expect(messages(check('locations', lagos([area('Yaba')], false)))).toContain(
      'Keep at least one active city with an active area.',
    )
    expect(messages(check('locations', lagos([area('Yaba', false)])))).toContain(
      'Keep at least one active city with an active area.',
    )
    expect(check('locations', lagos()).success).toBe(true)
  })

  it('needs an active category and a Quick Sell option', () => {
    expect(check('categories', [{ id: 'k', name: 'Phones', active: false }]).success).toBe(false)
    expect(check('quickSellOptions', []).success).toBe(false)
    expect(check('quickSellOptions', ['24h', '7d']).success).toBe(true)
  })

  it('checks content rules and support contacts', () => {
    expect(check('contentRules', { prohibitedItems: ['Guns'], rulesUrl: 'http://x' }).success).toBe(false)
    expect(check('contentRules', { prohibitedItems: ['x'], rulesUrl: 'https://nextown.ng/rules' }).success).toBe(false)
    const support = { phone: '08031234567', email: 'support@nextown.ng', hours: 'Mon–Sat, 8am–6pm WAT' }
    expect(check('supportContacts', support).success).toBe(true)
    expect(check('supportContacts', { ...support, phone: '12345' }).success).toBe(false)
    // The hint's own example, with spaces, is accepted and stored without them (final review)
    const spaced = check('supportContacts', { ...support, phone: '0803 123 4567' })
    expect(spaced.success && spaced.data).toMatchObject({ phone: '08031234567' })
    expect(check('supportContacts', { ...support, phone: '+234 803 123 4567' }).success).toBe(true)
    expect(check('supportContacts', { ...support, email: 'nope' }).success).toBe(false)
  })
})
