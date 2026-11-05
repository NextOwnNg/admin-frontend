import { z } from 'zod'
import type { PilotSettings, QuickSellOption, SettingsSection } from '@/lib/api/types/settings'

/**
 * The pilot settings rules (Phase C design §4.5), shared by the forms and the mock API. Ranges marked DRAFT
 * are placeholders until the real API decides; the offer lifetime range is the PRD's.
 */

export const SECTION_LABELS: Record<SettingsSection, string> = {
  locations: 'Cities and areas',
  categories: 'Categories',
  offerLifetimeHours: 'Offer lifetime',
  quickSellOptions: 'Quick Sell options',
  reservationDays: 'Reservation duration',
  photoLimits: 'Photo limits',
  contentRules: 'Content rules',
  supportContacts: 'Support contacts',
}

export const SETTINGS_SECTIONS = Object.keys(SECTION_LABELS) as SettingsSection[]

export const QUICK_SELL_LABELS: Record<QuickSellOption, string> = {
  '24h': '24 hours',
  '48h': '48 hours',
  '72h': '72 hours',
  '7d': '7 days',
}

const wholeNumber = (min: number, max: number, unit: string) => {
  const error = `Enter a whole number of ${unit} from ${min} to ${max}.`
  return z.number({ error }).int({ error }).min(min, { error }).max(max, { error })
}

const name = z
  .string()
  .trim()
  .min(2, { error: 'Use 2 to 60 characters.' })
  .max(60, { error: 'Use 2 to 60 characters.' })
const place = z.object({ id: z.string().min(1), name, active: z.boolean() })

/** Names unique within their list, ignoring case and spaces */
function uniqueNames(rows: { name: string }[], ctx: z.RefinementCtx, path: (string | number)[]) {
  const seen = new Set<string>()
  rows.forEach((row, index) => {
    const key = row.name.trim().toLowerCase()
    if (seen.has(key)) {
      ctx.addIssue({
        code: 'custom',
        message: `${row.name.trim()} is already in the list.`,
        path: [...path, index, 'name'],
      })
    }
    seen.add(key)
  })
}

const locations = z.array(place.extend({ areas: z.array(place) })).superRefine((cities, ctx) => {
  uniqueNames(cities, ctx, [])
  cities.forEach((city, index) => uniqueNames(city.areas, ctx, [index, 'areas']))
  if (!cities.some((c) => c.active && c.areas.some((a) => a.active))) {
    ctx.addIssue({ code: 'custom', message: 'Keep at least one active city with an active area.', path: [] })
  }
})

const categories = z.array(place).superRefine((rows, ctx) => {
  uniqueNames(rows, ctx, [])
  if (!rows.some((r) => r.active)) {
    ctx.addIssue({ code: 'custom', message: 'Keep at least one active category.', path: [] })
  }
})

const photoCount = wholeNumber(1, 12, 'photos') // DRAFT
const photoLimits = z.object({ min: photoCount, max: photoCount }).refine((v) => v.min <= v.max, {
  error: "The minimum can't be more than the maximum.",
  path: ['max'],
})

const contentRules = z.object({
  prohibitedItems: z.array(
    z
      .string()
      .trim()
      .min(2, { error: 'Each item needs 2 to 80 characters.' })
      .max(80, { error: 'Each item needs 2 to 80 characters.' }),
  ),
  rulesUrl: z
    .string()
    .trim()
    .regex(/^https:\/\/\S+$/, { error: 'Use a link that starts with https://' }),
})

const supportContacts = z.object({
  phone: z
    .string()
    // People type numbers in groups; store them without the spaces
    .transform((s) => s.replace(/\s+/g, ''))
    .pipe(
      z.string().regex(/^(\+234|0)[789][01]\d{8}$/, { error: 'Enter a Nigerian phone number, like 0803 123 4567.' }),
    ),
  email: z.email({ error: 'Enter a valid email address.' }),
  hours: z
    .string()
    .trim()
    .min(2, { error: 'Use 2 to 120 characters.' })
    .max(120, { error: 'Use 2 to 120 characters.' }),
})

export const SECTION_SCHEMAS = {
  locations,
  categories,
  offerLifetimeHours: wholeNumber(24, 168, 'hours'),
  quickSellOptions: z
    .array(z.enum(['24h', '48h', '72h', '7d']))
    .min(1, { error: 'Choose at least one Quick Sell option.' }),
  reservationDays: wholeNumber(1, 14, 'days'), // DRAFT
  photoLimits,
  contentRules,
  supportContacts,
} satisfies { [S in SettingsSection]: z.ZodType<PilotSettings[S]> }
