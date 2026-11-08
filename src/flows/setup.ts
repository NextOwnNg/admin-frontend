import { cleanup } from '@testing-library/react'
import { afterEach, beforeAll } from 'vitest'
import { reseed } from '@/mocks/db/store'
import { staffDb } from '@/mocks/db/staff'
import { worker } from '@/mocks/browser'
import { clientErrorsDb } from '@/mocks/handlers/client-errors'
import { useSessionStore } from '@/stores/session'
import { useTablePrefs } from '@/stores/tablePrefs'
import { useUiStore } from '@/stores/ui'
import '@/styles/index.css'

// The mock admin API, as the dev server runs it: the MSW worker in the page, with its 400 ms latency
beforeAll(async () => {
  await worker.start({ quiet: true, onUnhandledFrame: 'bypass' })
})

afterEach(() => {
  cleanup()
  staffDb.reset()
  clientErrorsDb.reset()
  reseed()
  useSessionStore.setState(useSessionStore.getInitialState())
  useUiStore.setState(useUiStore.getInitialState())
  useTablePrefs.setState(useTablePrefs.getInitialState())
  localStorage.clear()
})
