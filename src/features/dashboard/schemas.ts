import { z } from 'zod'
import type { RangePreset } from '@/lib/copy/dashboard'
import { addDays } from '@/lib/time/time'

/** A calendar date that exists: `2026-10-45` or `2026-02-31` is dropped like any other bad value */
const date = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine((value) => !Number.isNaN(Date.parse(`${value}T00:00:00Z`)) && addDays(value, 0) === value)

/** The dashboard's URL parameters (Phase D design §4.1). Category and area are settings IDs. */
export const dashboardFilterSchema = z.object({
  range: z.enum(['7d', '30d', 'pilot']).optional(),
  from: date.optional(),
  to: date.optional(),
  category: z.string().min(1).max(64).optional(),
  area: z.string().min(1).max(64).optional(),
})

export type DashboardFilters = z.output<typeof dashboardFilterSchema>

export type ResolvedRange = { preset: RangePreset | 'custom'; from?: string; to: string }

/**
 * The dates a filter set asks for. Dates in the address make it a custom range (a missing end is today, a missing
 * start is the pilot's); otherwise the preset, by default the last 30 days. No start means "since the pilot began".
 */
export function resolveRange(filters: DashboardFilters, today: string): ResolvedRange {
  if (filters.from !== undefined || filters.to !== undefined) {
    return { preset: 'custom', from: filters.from, to: filters.to ?? today }
  }
  const preset = filters.range ?? '30d'
  if (preset === 'pilot') return { preset, to: today }
  return { preset, from: addDays(today, preset === '7d' ? -6 : -29), to: today }
}
