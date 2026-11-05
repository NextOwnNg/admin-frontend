import { QUICK_SELL_LABELS, SECTION_LABELS } from '@/features/settings/schemas'
import type { Category, City, PilotSettings, QuickSellOption, SettingsSection } from '@/lib/api/types/settings'

/** Settings in words: what a section holds, and what a change does, for the confirmation and history */

const hours = (n: number) => `${n} hours`
const days = (n: number) => (n === 1 ? '1 day' : `${n} days`)
const quickSell = (options: QuickSellOption[]) => options.map((o) => QUICK_SELL_LABELS[o]).join(', ')

/** One line per added, renamed, removed or re-activated place or category */
function placeChanges(
  kind: string,
  before: { id: string; name: string; active: boolean }[],
  after: typeof before,
  where = '',
) {
  const lines: string[] = []
  const suffix = where ? ` in ${where}` : ''
  for (const row of after) {
    const old = before.find((b) => b.id === row.id)
    if (!old) {
      lines.push(`Added ${kind} ${row.name}${suffix}${row.active ? '' : ' (inactive)'}`)
      continue
    }
    if (old.name !== row.name) lines.push(`Renamed ${kind} ${old.name} to ${row.name}${suffix}`)
    if (old.active !== row.active) lines.push(`Made ${kind} ${row.name} ${row.active ? 'active' : 'inactive'}${suffix}`)
  }
  for (const old of before) if (!after.some((a) => a.id === old.id)) lines.push(`Removed ${kind} ${old.name}${suffix}`)
  return lines
}

const arrow = (label: string, a: string, b: string) => (a === b ? [] : [`${label}: ${a} → ${b}`])

/** `"Offer lifetime: 72 hours → 96 hours"`, one line per change */
export function changeLines<S extends SettingsSection>(
  section: S,
  before: PilotSettings[S],
  after: PilotSettings[S],
): string[] {
  const label = SECTION_LABELS[section]
  switch (section) {
    case 'offerLifetimeHours':
      return arrow(label, hours(before as number), hours(after as number))
    case 'reservationDays':
      return arrow(label, days(before as number), days(after as number))
    case 'quickSellOptions':
      return arrow(label, quickSell(before as QuickSellOption[]), quickSell(after as QuickSellOption[]))
    case 'photoLimits': {
      const [b, a] = [before, after] as PilotSettings['photoLimits'][]
      return [
        ...arrow('Minimum photos', String(b!.min), String(a!.min)),
        ...arrow('Maximum photos', String(b!.max), String(a!.max)),
      ]
    }
    case 'contentRules': {
      const [b, a] = [before, after] as PilotSettings['contentRules'][]
      return [
        ...a!.prohibitedItems.filter((i) => !b!.prohibitedItems.includes(i)).map((i) => `Added prohibited item: ${i}`),
        ...b!.prohibitedItems
          .filter((i) => !a!.prohibitedItems.includes(i))
          .map((i) => `Removed prohibited item: ${i}`),
        ...arrow('Community rules link', b!.rulesUrl, a!.rulesUrl),
      ]
    }
    case 'supportContacts': {
      const [b, a] = [before, after] as PilotSettings['supportContacts'][]
      return [
        ...arrow('Support phone', b!.phone, a!.phone),
        ...arrow('Support email', b!.email, a!.email),
        ...arrow('Support hours', b!.hours, a!.hours),
      ]
    }
    case 'categories':
      return placeChanges('category', before as Category[], after as Category[])
    case 'locations': {
      const [b, a] = [before, after] as City[][]
      return [
        ...placeChanges('city', b!, a!),
        ...a!.flatMap((city) =>
          placeChanges('area', b!.find((c) => c.id === city.id)?.areas ?? [], city.areas, city.name),
        ),
      ]
    }
  }
  return []
}

/** A section's current value as short text, for the read-only view */
export function sectionSummary<S extends SettingsSection>(section: S, value: PilotSettings[S]): string[] {
  switch (section) {
    case 'offerLifetimeHours':
      return [`${hours(value as number)} after the latest version`]
    case 'reservationDays':
      return [`${days(value as number)} after acceptance`]
    case 'quickSellOptions':
      return [quickSell(value as QuickSellOption[])]
    case 'photoLimits': {
      const p = value as PilotSettings['photoLimits']
      return [`${p.min} to ${p.max} photos per listing`]
    }
    case 'contentRules': {
      const c = value as PilotSettings['contentRules']
      return [...c.prohibitedItems.map((i) => `Prohibited: ${i}`), `Community rules: ${c.rulesUrl}`]
    }
    case 'supportContacts': {
      const s = value as PilotSettings['supportContacts']
      return [`Phone: ${s.phone}`, `Email: ${s.email}`, `Hours: ${s.hours}`]
    }
    case 'categories':
      return [(value as Category[]).map((c) => (c.active ? c.name : `${c.name} (inactive)`)).join(', ')]
    case 'locations':
      return (value as City[]).map(
        (city) =>
          `${city.name}${city.active ? '' : ' (inactive)'}: ${city.areas
            .map((a) => (a.active ? a.name : `${a.name} (inactive)`))
            .join(', ')}`,
      )
  }
  return []
}
