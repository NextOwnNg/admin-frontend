import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { safeJsonStorage } from '@/lib/storage/safe-storage'

/** Column visibility and density per table (PRD §3.4). Never case data, notes or evidence. */
export type TablePrefs = { hiddenColumns: string[]; density: 'compact' | 'comfortable' }

type TablePrefsState = {
  prefs: Record<string, TablePrefs>
  setPrefs: (tableId: string, prefs: TablePrefs) => void
}

export const useTablePrefs = create<TablePrefsState>()(
  persist(
    (set) => ({
      prefs: {},
      setPrefs: (tableId, prefs) => set((state) => ({ prefs: { ...state.prefs, [tableId]: prefs } })),
    }),
    { name: 'nextown-admin-table-prefs', version: 1, storage: safeJsonStorage },
  ),
)
