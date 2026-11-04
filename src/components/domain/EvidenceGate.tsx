import { ExternalLink, FileLock2, Paperclip } from 'lucide-react'
import { useEffect, useState } from 'react'
import { PlainButton } from '@/components/ui/Button'
import { RevealReasonDialog } from '@/components/domain/RevealReasonDialog'
import { DENIED, isDenied, revealFailure } from '@/components/domain/reveal-errors'
import { formatWAT } from '@/lib/time/time'

type Item = { id: string; label: string }
type Link = { id: string; label: string; url: string; expiresAt: string }
type State =
  | { kind: 'locked' }
  | { kind: 'loading' }
  | { kind: 'available'; links: Link[] }
  | { kind: 'expired' }
  | { kind: 'denied' }

/**
 * Attachments behind a reason (design §4.3, §5.7): locked → reason → loading → available through
 * short-lived links → link expired, with a new link on request (the same reason, logged again).
 */
export function EvidenceGate({
  items,
  reveal,
}: {
  items: Item[]
  reveal: (reason: string, id: string) => Promise<{ url: string; expiresAt: string }>
}) {
  const [state, setState] = useState<State>({ kind: 'locked' })
  const [asking, setAsking] = useState(false)
  const [reason, setReason] = useState<string | null>(null)

  const expiresAt =
    state.kind === 'available' ? Math.min(...state.links.map((l) => Date.parse(l.expiresAt))) : Number.NaN
  useEffect(() => {
    if (Number.isNaN(expiresAt)) return
    const id = setTimeout(() => setState({ kind: 'expired' }), Math.max(0, expiresAt - Date.now()))
    return () => clearTimeout(id)
  }, [expiresAt])

  async function open(withReason: string) {
    setState({ kind: 'loading' })
    try {
      const links = await Promise.all(items.map(async (item) => ({ ...item, ...(await reveal(withReason, item.id)) })))
      setReason(withReason)
      setState({ kind: 'available', links })
    } catch (error) {
      if (isDenied(error)) {
        setState({ kind: 'denied' })
        return
      }
      setState(reason ? { kind: 'expired' } : { kind: 'locked' })
      throw revealFailure(error)
    }
  }

  if (items.length === 0) return <p className="text-compact text-muted">No evidence attached</p>

  return (
    <div className="flex flex-col gap-3">
      {state.kind === 'available' ? (
        <ul className="flex flex-col gap-2">
          {state.links.map((link) => (
            <li key={link.id}>
              <a
                href={link.url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 font-medium text-action underline underline-offset-2"
              >
                <Paperclip aria-hidden className="size-4" />
                {link.label}
                <ExternalLink aria-hidden className="size-3.5" />
                <span className="sr-only"> (opens in a new tab)</span>
              </a>
              <span className="ml-2 text-caption text-muted">Link works until {formatWAT(link.expiresAt)}</span>
            </li>
          ))}
        </ul>
      ) : (
        <ul className="flex flex-col gap-1 text-compact text-ink">
          {items.map((item) => (
            <li key={item.id} className="flex items-center gap-1.5">
              <FileLock2 aria-hidden className="size-4 text-muted" />
              {item.label}
            </li>
          ))}
        </ul>
      )}

      {state.kind === 'locked' && (
        <PlainButton size="compact" variant="secondary" className="self-start" onClick={() => setAsking(true)}>
          View evidence
        </PlainButton>
      )}
      {state.kind === 'loading' && (
        <p role="status" className="text-compact text-muted">
          Getting secure links…
        </p>
      )}
      {state.kind === 'expired' && (
        <div className="flex flex-wrap items-center gap-3">
          <p className="text-compact text-muted">Link expired</p>
          <PlainButton
            size="compact"
            variant="secondary"
            onClick={() => (reason ? void open(reason).catch(() => setAsking(true)) : setAsking(true))}
          >
            Get a new link
          </PlainButton>
        </div>
      )}
      {state.kind === 'denied' && <p className="text-compact text-muted">{DENIED}</p>}

      <RevealReasonDialog open={asking} onOpenChange={setAsking} title="View evidence?" onSubmit={open} />
    </div>
  )
}
