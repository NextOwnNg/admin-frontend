/** Shared chart styling: brand tokens only (Phase D design §4.3). Series colours in fixed order, never cycled. */
export const SERIES = ['var(--nx-chart-1)', 'var(--nx-chart-2)', 'var(--nx-chart-3)'] as const

/** Charts are aria-hidden (the table carries the figures), so Recharts' keyboard layer must stay off */
export const CHART = { accessibilityLayer: false } as const

export const AXIS = {
  stroke: 'var(--nx-border)',
  tick: { fill: 'var(--nx-slate)', fontSize: 12 },
  tickLine: false,
} as const

export const GRID = { stroke: 'var(--nx-border)', strokeDasharray: '0', vertical: false } as const

export const TOOLTIP = {
  contentStyle: {
    background: 'var(--nx-paper)',
    border: '1px solid var(--nx-border)',
    borderRadius: 'var(--nx-radius-sm)',
    color: 'var(--nx-ink)',
    fontSize: 13,
  },
  cursor: { fill: 'var(--nx-mint)' },
} as const

/** Legend text stays in ink; the coloured dot beside it carries the series (never text in a series colour) */
export const LEGEND = {
  wrapperStyle: { fontSize: 13 },
  iconType: 'circle',
  // Series order, as drawn; Recharts sorts by name otherwise
  itemSorter: null,
  formatter: (value: string) => <span style={{ color: 'var(--nx-ink)' }}>{value}</span>,
} as const
