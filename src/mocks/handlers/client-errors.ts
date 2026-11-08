import { http, HttpResponse, type RequestHandler } from 'msw'
import { apiBaseUrl } from '@/lib/env'
import type { ClientErrorReport } from '@/lib/observability/report-error'

let received: ClientErrorReport[] = []

/** What the console reported, for tests */
export const clientErrorsDb = {
  list: () => received,
  reset: () => {
    received = []
  },
}

export const clientErrorHandlers: RequestHandler[] = [
  // Accepted from anyone: an error can happen before sign-in (design §7)
  http.post(`${apiBaseUrl}/admin/client-errors`, async ({ request }) => {
    received = [...received, (await request.json()) as ClientErrorReport]
    return new HttpResponse(null, { status: 204 })
  }),
]
