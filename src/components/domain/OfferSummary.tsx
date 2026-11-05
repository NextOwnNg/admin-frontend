import { Link } from 'react-router'
import type { OfferSide, OfferTerms } from '@/lib/api/types/transactions'
import { cx } from '@/lib/cx'
import { cashDirection } from '@/lib/money/money'

/** Where an item's record lives, for staff who may open item records */
type ItemHref = (itemId: string) => string

function Side({
  side,
  compact,
  itemHref,
  paysCash,
}: {
  side: OfferSide
  compact: boolean
  itemHref?: ItemHref
  paysCash: boolean
}) {
  const Title = compact ? 'p' : 'h3'
  return (
    <div className={cx('flex flex-col gap-2 rounded-control bg-cloud', compact ? 'p-3' : 'p-4')}>
      <Title className="text-compact font-semibold text-ink">{side.displayName} gives</Title>
      {side.items.length === 0 && (
        <p className="text-compact text-muted">{paysCash ? 'No items, cash only' : 'No items'}</p>
      )}
      <ul className="flex flex-col gap-2">
        {side.items.map((item) => (
          <li key={item.id} className="flex flex-col text-compact">
            {itemHref ? (
              <Link to={itemHref(item.id)} className="font-medium text-action underline-offset-2 hover:underline">
                {item.title}
              </Link>
            ) : (
              <span className="text-ink">{item.title}</span>
            )}
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
export function OfferSummary({
  terms,
  mode = 'full',
  itemHref,
}: {
  terms: OfferTerms
  mode?: 'compact' | 'full'
  itemHref?: ItemHref
}) {
  const compact = mode === 'compact'
  return (
    <div className="flex flex-col gap-3">
      <div className="grid gap-3 tablet:grid-cols-2">
        <Side
          side={terms.gives}
          compact={compact}
          itemHref={itemHref}
          paysCash={terms.cashDirection === 'OffererPays'}
        />
        <Side
          side={terms.receives}
          compact={compact}
          itemHref={itemHref}
          paysCash={terms.cashDirection === 'OwnerPays'}
        />
      </div>
      <p className="text-body font-semibold text-ink tabular-nums">
        {cashDirection(terms.cashDirection, terms.cashKobo)}
      </p>
    </div>
  )
}
