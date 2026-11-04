import { EyeOff } from 'lucide-react'
import { useState } from 'react'
import { PlainButton } from '@/components/ui/Button'
import { RevealReasonDialog } from '@/components/domain/RevealReasonDialog'
import { DENIED, isDenied, revealFailure } from '@/components/domain/reveal-errors'

const lowerFirst = (text: string) => text.charAt(0).toLowerCase() + text.slice(1)

/**
 * A private value, hidden until the operator gives a reason (PRD §7, ADM-T-02). The revealed value lives
 * only in this component: leaving the page masks it again.
 */
export function MaskedValue({ label, reveal }: { label: string; reveal: (reason: string) => Promise<string> }) {
  const [value, setValue] = useState<string | null>(null)
  const [denied, setDenied] = useState(false)
  const [asking, setAsking] = useState(false)

  async function submit(reason: string) {
    try {
      setValue(await reveal(reason))
    } catch (error) {
      if (!isDenied(error)) throw revealFailure(error)
      setDenied(true)
    }
  }

  return (
    <span className="inline-flex flex-wrap items-center gap-2">
      {value !== null ? (
        <span className="whitespace-pre-wrap text-ink tabular-nums">{value}</span>
      ) : denied ? (
        <span className="text-compact text-muted">{DENIED}</span>
      ) : (
        <>
          <span className="inline-flex items-center gap-1.5 rounded-small border border-dashed border-border bg-cloud px-2 py-0.5 text-compact text-muted">
            <EyeOff aria-hidden className="size-3.5" />
            Hidden
          </span>
          <PlainButton
            size="compact"
            variant="ghost"
            aria-label={`Reveal ${lowerFirst(label)}`}
            onClick={() => setAsking(true)}
          >
            Reveal
          </PlainButton>
        </>
      )}
      <span aria-live="polite" className="sr-only">
        {value !== null ? `${label} revealed` : ''}
      </span>
      <RevealReasonDialog
        open={asking}
        onOpenChange={setAsking}
        title={`Reveal ${lowerFirst(label)}?`}
        onSubmit={submit}
      />
    </span>
  )
}
