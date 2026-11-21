/**
 * The sample staff accounts' emails, their shared password and the emailed code the mock admin API accepts.
 * FICTIONAL, at the fictional nextown.test domain. Kept apart from the mock backend so the sign-in page's sample
 * accounts can use them without bundling the mock database.
 */
export const SAMPLE_PASSWORD = 'Pilot-2026!'
export const SAMPLE_CODE = '123456'

export const STAFF_EMAILS = {
  support_agent: 'chiamaka@nextown.test',
  moderator: 'tunde@nextown.test',
  administrator: 'ngozi@nextown.test',
  /** A marketplace member: a real account with a password, but not staff */
  nonStaff: 'member@nextown.test',
} as const
