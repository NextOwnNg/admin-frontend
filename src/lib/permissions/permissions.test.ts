import { describe, expect, it } from 'vitest'
import { canAccess, navItemsFor, RECORD_TABS } from '@/lib/permissions/permissions'

const labels = (roles: Parameters<typeof navItemsFor>[0]) => navItemsFor(roles).map((item) => item.label)

describe('navItemsFor (design §7)', () => {
  it('gives support agents their queues only', () => {
    expect(labels(['support_agent'])).toEqual(['Overview', 'Reports', 'Exceptions'])
  })

  it('gives moderators the queue and record browsers', () => {
    expect(labels(['moderator'])).toEqual(['Overview', 'Reports', 'Members', 'Listings', 'Transactions'])
  })

  it('gives administrators everything, in sidebar order', () => {
    expect(labels(['administrator'])).toEqual([
      'Overview',
      'Reports',
      'Members',
      'Listings',
      'Transactions',
      'Exceptions',
      'Moderation log',
      'Settings',
      'Dashboard',
    ])
  })

  it('combines several roles without duplicates', () => {
    expect(labels(['support_agent', 'moderator'])).toEqual([
      'Overview',
      'Reports',
      'Members',
      'Listings',
      'Transactions',
      'Exceptions',
    ])
  })

  it('shows nothing without a role', () => {
    expect(labels([])).toEqual([])
  })
})

describe('canAccess', () => {
  it('keeps settings for administrators', () => {
    expect(canAccess('settings', ['moderator'])).toBe(false)
    expect(canAccess('settings', ['administrator'])).toBe(true)
  })

  it('lets every staff role open a case; the API decides who is assigned', () => {
    expect(canAccess('case', ['support_agent'])).toBe(true)
  })
})

describe('RECORD_TABS', () => {
  it('lists the seven record browsers', () => {
    expect(RECORD_TABS.map((t) => t.to)).toEqual([
      '/records/users',
      '/records/items',
      '/records/listings',
      '/records/offers',
      '/records/transactions',
      '/records/feed',
      '/records/reports',
    ])
  })
})
