import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { safeJsonStorage } from '@/lib/storage/safe-storage'

/** Column visibility and density per table (PRD §3.4). Never case data, notes or evidence. */
export type TablePrefs = { hiddenColumns: string[]; density: 'compact' | 'comfortable' }

/** A table nobody has adjusted yet */
export const DEFAULT_TABLE_PREFS: TablePrefs = { hiddenColumns: [], density: 'comfortable' }

type TablePrefsState = {
  prefs: Record<string, TablePrefs>
  setPrefs: (tableId: string, prefs: TablePrefs) => void
}

const isTablePrefs = (value: unknown): value is TablePrefs => {
  if (typeof value !== 'object' || value === null) return false
  const { hiddenColumns, density } = value as Partial<TablePrefs>
  return (
    Array.isArray(hiddenColumns) &&
    hiddenColumns.every((c) => typeof c === 'string') &&
    (density === 'compact' || density === 'comfortable')
  )
}

/** Keeps only stored entries with the right shape: storage is edited by hand and by older versions. */
function validPrefs(stored: unknown): Record<string, TablePrefs> {
  if (typeof stored !== 'object' || stored === null || Array.isArray(stored)) return {}
  return Object.fromEntries(Object.entries(stored).filter(([, prefs]) => isTablePrefs(prefs)))
}

export const useTablePrefs = create<TablePrefsState>()(
  persist(
    (set) => ({
      prefs: {},
      setPrefs: (tableId, prefs) => set((state) => ({ prefs: { ...state.prefs, [tableId]: prefs } })),
    }),
    {
      name: 'nextown-admin-table-prefs',
      version: 1,
      storage: safeJsonStorage,
      partialize: ({ prefs }) => ({ prefs }),
      merge: (persisted, current) => ({
        ...current,
        prefs: validPrefs((persisted as { prefs?: unknown } | undefined)?.prefs),
      }),
    },
  ),
)
