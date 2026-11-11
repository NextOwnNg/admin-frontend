import { formatWATDate, watDayStart } from '@/lib/time/time'

/** Display arithmetic only: the API counts, the console divides (Phase D design §3.1) */

/** `"38% (19 of 50)"`; `null` when there is nothing to divide by */
export function percentOf(n: number, d: number): string | null {
  if (d === 0) return null
  return `${Math.round((n / d) * 100)}% (${n} of ${d})`
}

/** `"4.1 per 100 accepted (3 of 73)"`; `null` when there is nothing to divide by */
export function per100(n: number, d: number, base: string): string | null {
  if (d === 0) return null
  return `${((n / d) * 100).toFixed(1)} per 100 ${base} (${n} of ${d})`
}

/** `"36 h"` below two days, then `"3.2 days"` */
export function formatHours(hours: number | null): string | null {
  if (hours === null) return null
  return hours < 48 ? `${Math.round(hours)} h` : `${(hours / 24).toFixed(1)} days`
}

/** What a figure says when its denominator is zero */
export const noneInRange = (noun: string) => `No ${noun} in this range`

/**
 * A per-100 figure whose count isn't a subset of its base: `"31.6 per 100 accepted (6 cases, 19 accepted)"`
 */
export function per100Against(n: number, d: number, noun: string, base: string): string | null {
  if (d === 0) return null
  return `${((n / d) * 100).toFixed(1)} per 100 ${base} (${n} ${noun}, ${d} ${base})`
}

/** A WAT calendar date for display: `"26 Oct 2026"` */
export const formatDay = (date: string) => formatWATDate(watDayStart(date))
