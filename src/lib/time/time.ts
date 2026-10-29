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
