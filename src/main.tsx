import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from '@/app/App'
import { useMockApi } from '@/lib/env'
import '@/styles/index.css'

/**
 * The mock admin API (fictional data) answers every request until the backend exists. It runs wherever
 * VITE_USE_MOCK_API=true: locally, and on preview deployments.
 */
async function startMockApi() {
  if (!useMockApi) return
  const { worker } = await import('@/mocks/browser')
  await worker.start({ onUnhandledFrame: 'bypass', quiet: true })
}

const root = document.getElementById('root')
if (!root) throw new Error('Root element #root not found')

void startMockApi().then(() => {
  createRoot(root).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
})
