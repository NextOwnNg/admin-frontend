import type { ListingMode } from '@/lib/api/types/records'

/**
 * Operations dashboard (ADM-FE-10, Phase D design §4.4). The API sends counts only, already filtered; the console
 * divides them for display and never invents a figure. Definitions follow parent PRD §13.1.
 */

export type ModeKey = ListingMode | 'ALL'

/** Listings that completed within a window, out of those published long enough ago to have had the chance */
export type Window = { completed: number; eligible: number }

/** A window is `null` while no listing in the cohort is old enough for it */
export type LiquidityRow = {
  id: string
  name: string
  cohort: number
  d7: Window | null
  d14: Window | null
  d30: Window | null
}

export type TrustCounts = { accepted: number; cancelled: number; disputed: number; lossReported: number }

/** A figure the system can't measure yet, with the reason */
export type Unmeasured = { value: null; reason: string }

/** `GET /admin/dashboard`: WAT calendar dates; category and area are settings IDs. No `from` = since the pilot began */
export type DashboardQuery = { from?: string; to: string; category?: string; area?: string }

export type DashboardData = {
  /** The range the figures cover, after the API clamped it to the pilot and today; a range wholly outside the pilot comes back as asked, with nothing counted */
  range: { from: string; to: string }
  pilotStart: string
  dataThrough: string
  maturityDays: number
  funnel: { published: number; receivedOffer: number; accepted: number; completed: number }
  acceptance: Record<ModeKey, { accepted: number; decided: number }>
  /** The rate counts mature acceptances only; `medianHours` is over every completed deal in the cohort */
  completion: Record<ModeKey, { completed: number; matureAccepted: number; medianHours: number | null }>
  liquidity: { byCategory: LiquidityRow[]; byArea: LiquidityRow[] }
  trust: TrustCounts & { weekly: (TrustCounts & { weekStart: string })[] }
  support: {
    opened: number
    resolved: number
    medianHoursToResolve: number | null
    weekly: { weekStart: string; opened: number; resolved: number }[]
    minutesPerCompleted: Unmeasured
    costPerCompleted: Unmeasured
  }
}
