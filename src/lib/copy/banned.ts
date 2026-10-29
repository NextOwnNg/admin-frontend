/**
 * Claims the console must never make (PRD §4.7, the marketplace's list). Longer phrases come first so a
 * match reports the most specific phrase before its shorter parent.
 */
export const BANNED_PHRASES = [
  'Verified person',
  'Verified seller',
  'Identity verified',
  'Escrow protected',
  'Escrow',
  'Guaranteed buyer',
  'Secure payment',
  'Protected payment',
  'We hold your money',
  'Funds secured',
  'Payment confirmed by NextOwn',
  'Certified authentic',
  'Fraud-free',
  'Delivery guaranteed',
] as const

export function findBannedPhrases(text: string): string[] {
  const haystack = text.toLowerCase()
  return BANNED_PHRASES.filter((phrase) => haystack.includes(phrase.toLowerCase()))
}
