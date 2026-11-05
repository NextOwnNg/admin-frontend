import type { AuditEntry } from '@/lib/api/types/audit'

/**
 * Pilot settings (Phase C design §4.5, ADM-FE-09): one versioned document, changed a section at a time.
 * Changes apply to new listings, offers and reservations only; agreements already made keep their terms.
 */

export type QuickSellOption = '24h' | '48h' | '72h' | '7d'
export type Area = { id: string; name: string; active: boolean }
export type City = Area & { areas: Area[] }
export type Category = { id: string; name: string; active: boolean }

export type PilotSettings = {
  version: number
  updatedAt: string
  updatedBy: string
  locations: City[]
  categories: Category[]
  offerLifetimeHours: number
  quickSellOptions: QuickSellOption[]
  reservationDays: number
  photoLimits: { min: number; max: number }
  contentRules: { prohibitedItems: string[]; rulesUrl: string }
  supportContacts: { phone: string; email: string; hours: string }
  /** IDs that listings or agreements refer to: they can be made inactive, never removed */
  inUse: string[]
}

export type SettingsSection =
  | 'locations'
  | 'categories'
  | 'offerLifetimeHours'
  | 'quickSellOptions'
  | 'reservationDays'
  | 'photoLimits'
  | 'contentRules'
  | 'supportContacts'

/** `PUT /admin/settings/:section` */
export type SettingsUpdateBody<S extends SettingsSection = SettingsSection> = {
  value: PilotSettings[S]
  reason: string
  expectedVersion: number
}
export type SettingsUpdateResult = { settings: PilotSettings; auditEntry: AuditEntry }

/** `GET /admin/settings/history`, newest first */
export type SettingsVersion = {
  version: number
  section: SettingsSection
  by: string
  at: string
  reason: string
  before: unknown
  after: unknown
}
