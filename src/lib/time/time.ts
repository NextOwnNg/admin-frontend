/** Timestamps arrive in UTC and display in West Africa Time; audit entries also show exact UTC (PRD §4.6). */

const TIME_ZONE = 'Africa/Lagos'
const MINUTE = 60_000
const HOUR = 60 * MINUTE

const dateFormatter = new Intl.DateTimeFormat('en-GB', {
  timeZone: TIME_ZONE,
  day: 'numeric',
  month: 'short',
  year: 'numeric',
})

const timeFormatter = new Intl.DateTimeFormat('en-GB', {
  timeZone: TIME_ZONE,
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
})

/** `"24 Oct 2026"` */
export function formatWATDate(iso: string): string {
  return dateFormatter.format(new Date(iso))
}

/** `"24 Oct 2026, 18:05 WAT"` */
export function formatWAT(iso: string): string {
  const date = new Date(iso)
  return `${dateFormatter.format(date)}, ${timeFormatter.format(date)} WAT`
}

/** `"2026-10-24 17:05:00 UTC"`: the exact time, for ordering audit and timeline entries. */
export function formatUTC(iso: string): string {
  return `${new Date(iso).toISOString().slice(0, 19).replace('T', ' ')} UTC`
}

/** `"5 min ago"`, `"3 h ago"`, `"Yesterday"`, then the WAT date. Pair it with the absolute time. */
export function timeAgo(iso: string, now: number): string {
  const elapsed = now - Date.parse(iso)
  if (elapsed < MINUTE) return 'Just now'
  if (elapsed < HOUR) return `${Math.floor(elapsed / MINUTE)} min ago`
  if (elapsed < 24 * HOUR) return `${Math.floor(elapsed / HOUR)} h ago`
  if (elapsed < 48 * HOUR) return 'Yesterday'
  return formatWATDate(iso)
}

/** `"3 h ago · 24 Oct 2026, 18:05 WAT"`: relative times are never shown alone. */
export function withRelative(iso: string, now: number): string {
  return `${timeAgo(iso, now)} · ${formatWAT(iso)}`
}

/** `"Due in 42 min"`, `"Due in 3 h"`, `"Due in 2 days"`, or `"Overdue"` once past. */
export function dueText(iso: string, now: number): string {
  const left = Date.parse(iso) - now
  if (left <= 0) return 'Overdue'
  if (left < HOUR) return `Due in ${Math.max(1, Math.floor(left / MINUTE))} min`
  if (left < 48 * HOUR) return `Due in ${Math.floor(left / HOUR)} h`
  return `Due in ${Math.floor(left / (24 * HOUR))} days`
}

const WAT_OFFSET_MS = HOUR

/** The first instant of a WAT calendar day (`"2026-11-05"`), as UTC ISO: filters by the day operators see. */
export function watDayStart(date: string): string {
  return new Date(Date.parse(`${date}T00:00:00Z`) - WAT_OFFSET_MS).toISOString()
}

/** The last millisecond of a WAT calendar day, as UTC ISO */
export function watDayEnd(date: string): string {
  return new Date(Date.parse(`${date}T00:00:00Z`) + 24 * HOUR - WAT_OFFSET_MS - 1).toISOString()
}

const DAY = 24 * HOUR

/** Today's WAT calendar date, `"2026-11-08"`: what operators mean by "today". */
export function watToday(nowMs: number): string {
  return new Date(nowMs + WAT_OFFSET_MS).toISOString().slice(0, 10)
}

/** A calendar date `days` later (or earlier, when negative) */
export function addDays(date: string, days: number): string {
  return new Date(Date.parse(`${date}T00:00:00Z`) + days * DAY).toISOString().slice(0, 10)
}

/** Calendar days from `from` to `to`, counting both: the same day is 1 */
export function daysBetween(from: string, to: string): number {
  return Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / DAY) + 1
}
