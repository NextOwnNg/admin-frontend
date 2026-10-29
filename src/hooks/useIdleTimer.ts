import { useCallback, useEffect, useRef, useState } from 'react'

const ACTIVITY_EVENTS = ['pointerdown', 'keydown', 'wheel', 'scroll'] as const

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

  useEffect(() => {
    lastActive.current = Date.now()
    const markActive = () => {
      if (!warningRef.current) lastActive.current = Date.now()
    }
    for (const event of ACTIVITY_EVENTS) window.addEventListener(event, markActive, { capture: true, passive: true })
    return () => {
      for (const event of ACTIVITY_EVENTS) window.removeEventListener(event, markActive, { capture: true })
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
    timedOut.current = false
    setSecondsLeft(timeoutSeconds)
  }, [timeoutSeconds])

  return { warning, secondsLeft, stayActive }
}
