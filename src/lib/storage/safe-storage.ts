import { createJSONStorage } from 'zustand/middleware'

/**
 * localStorage that never throws (PRD §3.4): private windows, blocked site data and full quotas all fall back
 * to "nothing stored". Preferences only; never case data, notes or evidence.
 */
export const safeStorage = {
  get(key: string): string | null {
    try {
      return localStorage.getItem(key)
    } catch {
      return null
    }
  },
  set(key: string, value: string): void {
    try {
      localStorage.setItem(key, value)
    } catch {
      // Storage unavailable: the preference lasts until reload
    }
  },
  remove(key: string): void {
    try {
      localStorage.removeItem(key)
    } catch {
      // Storage unavailable: nothing to remove
    }
  },
}

/** Zustand `persist` storage over safeStorage. Corrupt JSON reads as nothing stored. */
export const safeJsonStorage = createJSONStorage(() => ({
  getItem: (key: string) => {
    const raw = safeStorage.get(key)
    if (raw === null) return null
    try {
      JSON.parse(raw)
      return raw
    } catch {
      return null
    }
  },
  setItem: (key: string, value: string) => safeStorage.set(key, value),
  removeItem: (key: string) => safeStorage.remove(key),
}))
