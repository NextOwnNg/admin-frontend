import { useEffect, useState } from 'react'

/**
 * Due dates and idle timers use server time, not the device clock (PRD §3.4). The API client records the offset
 * from each response's Date header; components read `serverNow()`.
 */
let offsetMs = 0

export function recordServerDate(dateHeader: string | undefined, receivedAt = Date.now()) {
  if (!dateHeader) return
  const serverMs = Date.parse(dateHeader)
  if (!Number.isNaN(serverMs)) offsetMs = serverMs - receivedAt
}

export function serverNow(): number {
  return Date.now() + offsetMs
}

/** Re-renders at most once a minute: relative deadlines never tick by the second. */
export function useServerNow(intervalMs = 60_000): number {
  const [now, setNow] = useState(serverNow)
  useEffect(() => {
    const id = window.setInterval(() => setNow(serverNow()), intervalMs)
    return () => window.clearInterval(id)
  }, [intervalMs])
  return now
}
