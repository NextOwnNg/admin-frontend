/** All API money is integer kobo (PRD §4.6). The console shows whole naira, never floating-point arithmetic. */

const KOBO_PER_NAIRA = 100

const nairaFormatter = new Intl.NumberFormat('en-NG', { maximumFractionDigits: 0 })

/** `35_000_000` → `"₦350,000"` */
export function formatNaira(kobo: number): string {
  return `₦${nairaFormatter.format(Math.trunc(kobo / KOBO_PER_NAIRA))}`
}

export type CashDirection = 'OffererPays' | 'OwnerPays' | 'None'

/** Cash direction is always a sentence, never a signed number (PRD §4.6). */
export function cashDirection(direction: CashDirection, kobo: number): string {
  if (direction === 'OffererPays') return `Offerer pays owner ${formatNaira(kobo)}`
  if (direction === 'OwnerPays') return `Owner pays offerer ${formatNaira(kobo)}`
  return 'No cash'
}
