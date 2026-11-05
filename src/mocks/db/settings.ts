import type { PilotSettings, SettingsSection, SettingsVersion } from '@/lib/api/types/settings'
import { droppedAnswers, store } from '@/mocks/db/store'

/** The id under which a lost settings answer is simulated */
export const SETTINGS_RECORD = 'settings'

export const settingsDb = {
  get: (): PilotSettings => structuredClone(store().settings),

  history: (): SettingsVersion[] => structuredClone([...store().settingsHistory].reverse()),

  /** Applies one section and records the version; validation happens in the handler */
  apply<S extends SettingsSection>(section: S, value: PilotSettings[S], by: string, reason: string): PilotSettings {
    const state = store()
    const before = structuredClone(state.settings[section])
    state.settings = {
      ...state.settings,
      [section]: structuredClone(value),
      version: state.settings.version + 1,
      updatedAt: new Date().toISOString(),
      updatedBy: by,
    }
    state.settingsHistory.push({
      version: state.settings.version,
      section,
      by,
      at: state.settings.updatedAt,
      reason,
      before,
      after: structuredClone(value),
    })
    return settingsDb.get()
  },

  /** Tests: the next settings write is applied, then its answer is lost (design §5.6) */
  failNextWithTimeoutAfterApply: () => void droppedAnswers().add(SETTINGS_RECORD),
}
