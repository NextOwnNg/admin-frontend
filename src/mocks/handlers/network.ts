import { delay, HttpResponse } from 'msw'
import { useDevSettings } from '@/mocks/dev-settings'

/** Simulated network: latency and a one-shot failure from the dev toolbar (no-ops in tests). */
export async function network() {
  if (import.meta.env.MODE !== 'test') await delay(useDevSettings.getState().latencyMs)
  // Read after the delay: requests that started together must not all claim the one failure
  const { failNext, setFailNext } = useDevSettings.getState()
  if (failNext) {
    setFailNext(false)
    return HttpResponse.json({ code: 'SERVER_ERROR', message: 'Simulated failure' }, { status: 503 })
  }
  return null
}
