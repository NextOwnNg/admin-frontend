import type { ReactElement } from 'react'
import { ResponsiveContainer } from 'recharts'

/** Every dashboard chart's box: full width, fixed height; the initial size lets it draw before it is measured */
export function ChartFrame({ children }: { children: ReactElement }) {
  return (
    <ResponsiveContainer width="100%" height={260} initialDimension={{ width: 640, height: 260 }}>
      {children}
    </ResponsiveContainer>
  )
}
