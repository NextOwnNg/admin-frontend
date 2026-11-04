import type { OfferSide, OfferTerms } from '@/lib/api/types/transactions'
import { cx } from '@/lib/cx'
import { cashDirection } from '@/lib/money/money'

function Side({ side, compact }: { side: OfferSide; compact: boolean }) {
  const Title = compact ? 'p' : 'h3'
  return (
    <div className={cx('flex flex-col gap-2 rounded-control bg-cloud', compact ? 'p-3' : 'p-4')}>
      <Title className="text-compact font-semibold text-ink">{side.displayName} gives</Title>
      <ul className="flex flex-col gap-2">
        {side.items.map((item) => (
          <li key={item.id} className="flex flex-col text-compact">
            <span className="text-ink">{item.title}</span>
            {!compact && (
              <>
                <span className="text-muted">{item.condition}</span>
                {item.defects && (
                  <span className="text-muted">
                    Defects: <span className="text-ink">{item.defects}</span>
                  </span>
                )}
              </>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}

/** What each participant gives and the cash, always as a sentence (design §4.4, PRD §4.6). */
export function OfferSummary({ terms, mode = 'full' }: { terms: OfferTerms; mode?: 'compact' | 'full' }) {
  const compact = mode === 'compact'
  return (
    <div className="flex flex-col gap-3">
      <div className="grid gap-3 tablet:grid-cols-2">
        <Side side={terms.gives} compact={compact} />
        <Side side={terms.receives} compact={compact} />
      </div>
      <p className="text-body font-semibold text-ink tabular-nums">
        {cashDirection(terms.cashDirection, terms.cashKobo)}
      </p>
    </div>
  )
}
