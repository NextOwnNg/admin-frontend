import { useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'

const EARLY_MS = 60_000
/** Never sooner: links that are already short-lived must not set off a stream of reads */
const MIN_MS = 10_000
/** Never later: also keeps far-off expiries inside what setTimeout can hold */
const MAX_MS = 60 * 60_000

/**
 * Reads a record again a minute before its earliest signed link expires, so open pages never show broken
 * media. At most every 10 s and at least hourly; a failed read is tried again on the next tick.
 */
export function useRefreshBeforeExpiry(queryKey: readonly unknown[], expiries: string[]) {
  const queryClient = useQueryClient()
  const [tick, setTick] = useState(0)
  const earliest = expiries.length > 0 ? Math.min(...expiries.map((e) => Date.parse(e))) : null
  const key = JSON.stringify(queryKey)
  useEffect(() => {
    if (earliest === null || Number.isNaN(earliest)) return
    const delay = Math.min(MAX_MS, Math.max(MIN_MS, earliest - EARLY_MS - Date.now()))
    const timer = setTimeout(() => {
      void queryClient.invalidateQueries({ queryKey: JSON.parse(key) as unknown[] })
      setTick((t) => t + 1)
    }, delay)
    return () => clearTimeout(timer)
  }, [earliest, key, queryClient, tick])
}
