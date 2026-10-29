import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterAll, afterEach, beforeAll } from 'vitest'
import { staffDb } from '@/mocks/db/staff'
import { useSessionStore } from '@/stores/session'
import { useTablePrefs } from '@/stores/tablePrefs'
import { useUiStore } from '@/stores/ui'
import { server } from '@/test/msw/server'

// jsdom has no layout engine; React Router's ScrollRestoration calls this
window.scrollTo = () => {}

// jsdom has no matchMedia; no breakpoint or preference queries match
window.matchMedia = (query: string) =>
  ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  }) as MediaQueryList

// jsdom has no ResizeObserver; HeroUI's overlays measure with it
globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
}

beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
afterEach(() => {
  server.resetHandlers()
  staffDb.reset()
  // Client stores outlive a render; every test starts with no session check and default preferences
  useSessionStore.setState(useSessionStore.getInitialState())
  useUiStore.setState(useUiStore.getInitialState())
  useTablePrefs.setState(useTablePrefs.getInitialState())
  localStorage.clear()
  cleanup()
})
afterAll(() => server.close())
