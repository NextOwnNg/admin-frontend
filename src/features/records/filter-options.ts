import type { FilterOption } from '@/components/data/filter-utils'
import { useSettings } from '@/features/settings/api/useSettings'

/** Active areas of active cities, from the pilot settings */
export function useAreaOptions(): FilterOption[] {
  const settings = useSettings()
  return (settings.data?.locations ?? [])
    .filter((c) => c.active)
    .flatMap((c) => c.areas.filter((a) => a.active).map((a) => a.name))
    .sort((a, b) => a.localeCompare(b))
    .map((name) => ({ value: name, label: name }))
}

/** Active categories, from the pilot settings */
export function useCategoryOptions(): FilterOption[] {
  const settings = useSettings()
  return (settings.data?.categories ?? [])
    .filter((c) => c.active)
    .map((c) => c.name)
    .sort((a, b) => a.localeCompare(b))
    .map((name) => ({ value: name, label: name }))
}

/** Any name the settings accept (2 to 60 characters); control characters never are */
export const PLACE_NAME = /^[^\p{Cc}]{2,60}$/u
