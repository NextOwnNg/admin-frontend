import { cx } from '@/lib/cx'
import { formatNaira } from '@/lib/money/money'

/** Kobo shown as whole naira, in tabular figures so columns line up. */
export function MoneyText({ kobo, size = 'default' }: { kobo: number; size?: 'default' | 'large' }) {
  return <span className={cx('tabular-nums', size === 'large' && 'text-price')}>{formatNaira(kobo)}</span>
}
