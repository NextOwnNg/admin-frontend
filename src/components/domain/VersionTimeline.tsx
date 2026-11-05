import { Ban, CircleCheck, Clock, History, Hourglass, Undo2, type LucideIcon } from 'lucide-react'
import { OfferSummary } from '@/components/domain/OfferSummary'
import { StatusBadge, type StatusTone } from '@/components/ui/StatusBadge'
import type { OfferVersion } from '@/lib/api/types/transactions'
import { formatWAT } from '@/lib/time/time'

const STATE: Record<OfferVersion['state'], { label: string; icon: LucideIcon; tone: StatusTone }> = {
  pending: { label: 'Awaiting reply', icon: Hourglass, tone: 'info' },
  accepted: { label: 'Accepted', icon: CircleCheck, tone: 'success' },
  superseded: { label: 'Superseded', icon: History, tone: 'neutral' },
  expired: { label: 'Expired', icon: Clock, tone: 'neutral' },
  rejected: { label: 'Rejected', icon: Ban, tone: 'neutral' },
  withdrawn: { label: 'Withdrawn', icon: Undo2, tone: 'neutral' },
}

/** Every offer version, newest first, read-only (design §4.4). */
export function VersionTimeline({ versions }: { versions: OfferVersion[] }) {
  const newestFirst = [...versions].sort((a, b) => b.number - a.number)
  return (
    <ol aria-label="Offer versions" className="flex flex-col gap-4 border-l-2 border-border pl-4">
      {newestFirst.map((v) => (
        <li key={v.number} aria-label={`Version ${v.number}`} className="flex flex-col gap-2">
          <p className="flex flex-wrap items-center gap-2 text-compact">
            <span className="font-semibold text-ink">Version {v.number}</span>
            <StatusBadge {...STATE[v.state]} />
            <span className="text-muted">
              Proposed by {v.proposedBy} · <span className="tabular-nums">{formatWAT(v.at)}</span>
            </span>
          </p>
          <OfferSummary terms={v.terms} mode="compact" />
        </li>
      ))}
    </ol>
  )
}
