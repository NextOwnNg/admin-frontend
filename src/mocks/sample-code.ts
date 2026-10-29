/**
 * The sample accounts' phone numbers and the codes the mock admin API accepts. FICTIONAL. Kept apart from the
 * mock backend so the sign-in page's sample accounts can use them without bundling the mock database.
 */
export const SAMPLE_CODE = '123456'
export const SAMPLE_SECOND_FACTOR = '654321'

export const STAFF_PHONES = {
  support_agent: '+2348000000101',
  moderator: '+2348000000102',
  administrator: '+2348000000103',
  /** A marketplace member: a real account, but not staff */
  nonStaff: '+2348000000199',
} as const
