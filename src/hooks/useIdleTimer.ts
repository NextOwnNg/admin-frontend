import { useCallback, useEffect, useRef, useState } from 'react'

const ACTIVITY_EVENTS = ['pointerdown', 'keydown', 'wheel', 'scroll'] as const
/** Console tabs share activity, so an idle tab never signs out the one being used (PRD §3.5) */
const CHANNEL = 'nextown-admin-activity'
const BROADCAST_EVERY_MS = 5_000

/**
 * Idle sign-out (PRD §3.5): a warning `warnSeconds` before `timeoutSeconds` of inactivity, then `onTimeout`.
 * Once the warning shows, only `stayActive()` (the modal's button) keeps the session: a stray key press or
 * scroll doesn't silently extend it.
 */
export function useIdleTimer({
  timeoutSeconds,
  warnSeconds = 60,
  onTimeout,
}: {
  timeoutSeconds: number
  warnSeconds?: number
  onTimeout: () => void
}) {
  const lastActive = useRef(0)
  const timedOut = useRef(false)
  const [secondsLeft, setSecondsLeft] = useState(timeoutSeconds)
  const warning = secondsLeft <= warnSeconds
  const warningRef = useRef(warning)
  const onTimeoutRef = useRef(onTimeout)

  useEffect(() => {
    warningRef.current = warning
    onTimeoutRef.current = onTimeout
  })

  const channel = useRef<BroadcastChannel | null>(null)

  useEffect(() => {
    lastActive.current = Date.now()
    channel.current = typeof BroadcastChannel === 'undefined' ? null : new BroadcastChannel(CHANNEL)
    let lastBroadcast = 0

    const markActive = () => {
      if (warningRef.current) return
      lastActive.current = Date.now()
      if (lastActive.current - lastBroadcast >= BROADCAST_EVERY_MS) {
        lastBroadcast = lastActive.current
        channel.current?.postMessage(lastActive.current)
      }
    }
    const otherTabActive = ({ data }: MessageEvent<unknown>) => {
      if (typeof data === 'number') lastActive.current = Math.max(lastActive.current, Math.min(data, Date.now()))
    }

    for (const event of ACTIVITY_EVENTS) window.addEventListener(event, markActive, { capture: true, passive: true })
    channel.current?.addEventListener('message', otherTabActive)
    return () => {
      for (const event of ACTIVITY_EVENTS) window.removeEventListener(event, markActive, { capture: true })
      channel.current?.close()
      channel.current = null
    }
  }, [])

  useEffect(() => {
    const id = window.setInterval(() => {
      const left = Math.max(0, timeoutSeconds - Math.floor((Date.now() - lastActive.current) / 1000))
      setSecondsLeft(left)
      if (left === 0 && !timedOut.current) {
        timedOut.current = true
        onTimeoutRef.current()
      }
    }, 1000)
    return () => window.clearInterval(id)
  }, [timeoutSeconds])

  const stayActive = useCallback(() => {
    lastActive.current = Date.now()
    channel.current?.postMessage(lastActive.current)
    timedOut.current = false
    setSecondsLeft(timeoutSeconds)
  }, [timeoutSeconds])

  return { warning, secondsLeft, stayActive }
}
