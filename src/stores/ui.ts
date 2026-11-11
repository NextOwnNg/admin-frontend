import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { DashboardSectionId } from '@/lib/copy/dashboard'
import { safeJsonStorage } from '@/lib/storage/safe-storage'

export type ChartView = 'chart' | 'table'

const SECTIONS: readonly DashboardSectionId[] = ['funnel', 'modes', 'liquidity', 'trust', 'support']

/** UI preferences only (PRD §3.4). */
type UiState = {
  sidebarCollapsed: boolean
  toggleSidebar: () => void
  /** Chart or table, per dashboard section (Phase D design §4.3) */
  chartViews: Partial<Record<DashboardSectionId, ChartView>>
  setChartView: (section: DashboardSectionId, view: ChartView) => void
}

/** Keeps only stored views for sections that exist: storage is edited by hand and by older versions. */
function validViews(stored: unknown): UiState['chartViews'] {
  if (typeof stored !== 'object' || stored === null || Array.isArray(stored)) return {}
  return Object.fromEntries(
    Object.entries(stored).filter(
      ([section, view]) => (SECTIONS as readonly string[]).includes(section) && (view === 'chart' || view === 'table'),
    ),
  )
}

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
      chartViews: {},
      setChartView: (section, view) => set((state) => ({ chartViews: { ...state.chartViews, [section]: view } })),
    }),
    {
      name: 'nextown-admin-ui',
      version: 1,
      storage: safeJsonStorage,
      partialize: ({ sidebarCollapsed, chartViews }) => ({ sidebarCollapsed, chartViews }),
      merge: (persisted, current) => {
        const stored = (persisted ?? {}) as { sidebarCollapsed?: unknown; chartViews?: unknown }
        return {
          ...current,
          sidebarCollapsed:
            typeof stored.sidebarCollapsed === 'boolean' ? stored.sidebarCollapsed : current.sidebarCollapsed,
          chartViews: validViews(stored.chartViews),
        }
      },
    },
  ),
)
