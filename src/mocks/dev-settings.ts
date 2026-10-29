import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { safeJsonStorage } from '@/lib/storage/safe-storage'

/** Dev-only controls for the mock API: simulated latency and a one-shot failure. Never in production. */
type DevSettings = {
  latencyMs: number
  failNext: boolean
  setLatency: (ms: number) => void
  setFailNext: (fail: boolean) => void
}

export const useDevSettings = create<DevSettings>()(
  persist(
    (set) => ({
      latencyMs: 400,
      failNext: false,
      setLatency: (latencyMs) => set({ latencyMs }),
      setFailNext: (failNext) => set({ failNext }),
    }),
    {
      name: 'nextown-admin-dev-settings',
      storage: safeJsonStorage,
      partialize: ({ latencyMs }) => ({ latencyMs }),
    },
  ),
)
