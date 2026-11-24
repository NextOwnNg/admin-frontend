import { Button } from '@heroui/react'
import { useEffect, useState } from 'react'
import type { ResendResult } from '@/lib/api/types/auth'

/**
 * "Resend code", offered once the API's wait has passed, then waiting again by the new answer's wait. A failure
 * goes to `onError` (the page's banner), and the button comes back.
 */
export function ResendCode({
  initialWait,
  onResend,
  onError,
}: {
  initialWait: number
  onResend: () => Promise<ResendResult>
  onError: (error: unknown) => void
}) {
  const [readyAt, setReadyAt] = useState(() => Date.now() + initialWait * 1000)
  const [now, setNow] = useState(() => Date.now())
  const [sending, setSending] = useState(false)
  const secondsLeft = Math.max(0, Math.ceil((readyAt - now) / 1000))

  useEffect(() => {
    if (secondsLeft === 0) return
    const timer = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(timer)
  }, [secondsLeft])

  async function resend() {
    setSending(true)
    try {
      const { resendAfterSeconds } = await onResend()
      setNow(Date.now())
      setReadyAt(Date.now() + resendAfterSeconds * 1000)
    } catch (error) {
      onError(error)
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <Button
        variant="tertiary"
        isDisabled={secondsLeft > 0}
        isPending={sending}
        onPress={() => void resend()}
        aria-describedby={secondsLeft > 0 ? 'resend-wait' : undefined}
      >
        Resend code
      </Button>
      {secondsLeft > 0 && (
        <p id="resend-wait" className="text-caption text-muted tabular-nums">
          You can resend in {secondsLeft} s
        </p>
      )}
    </div>
  )
}
